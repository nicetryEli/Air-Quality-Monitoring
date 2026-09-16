"""
gradient_boosting_aqi.py
-------------------------
Mô hình Gradient Boosting dự báo chất lượng không khí (AQI) cho 2 ngày tới (48 giờ tiếp theo)
phục vụ hệ thống cảnh báo sớm và lập kế hoạch di chuyển tối ưu cho nhóm nhạy cảm.

Tuân thủ yêu cầu:
1. Chia dữ liệu theo thời gian: 80% train, 20% test.
2. Trích xuất đặc trưng:
   - Gom theo ngày thứ trong tuần (dayofweek: T2 đầu tuần nhiều xe, Chủ nhật ít xe).
   - Cờ ngày cuối tuần (is_weekend).
   - Giờ trong ngày (hour), tháng (month), mùa (season).
   - Các đặc trưng độ trễ (lags) 24h, 48h và trung bình trượt 24h của nồng độ ô nhiễm.
   - Điều kiện khí tượng: nhiệt độ, áp suất, điểm sương, lượng mưa, tốc độ gió, hướng gió.
3. Dự báo AQI 2 ngày tiếp theo (48h tới).
4. Xuất kết quả theo API Contract (Phần 4.1 đăng ký metadata và Phần 4.2 nạp dự báo).
"""

import argparse
import datetime
import json
import sys
from pathlib import Path

# Đảm bảo UTF-8 trên Windows console
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error, root_mean_squared_error


# Đường dẫn dữ liệu mặc định
ROOT_DIR = Path(__file__).parent
DEFAULT_DATASET = ROOT_DIR / "dataset" / "1_Master_Data.csv"
OUTPUT_METRICS_JSON = ROOT_DIR / "docs" / "model_metadata.json"
OUTPUT_FORECAST_JSON = ROOT_DIR / "dataset" / "forecast_48h.json"
MODEL_FILE = ROOT_DIR / "dataset" / "gradient_boosting_aqi.joblib"

STATION_LOCATION_CSV = ROOT_DIR / "dataset" / "5_Station_Location.csv"

POLLUTANTS = ["PM2.5", "PM10", "SO2", "NO2", "CO", "O3"]
WEATHER_COLS = ["TEMP", "PRES", "DEWP", "RAIN", "WSPM"]

# 6 Phân lớp AQI chuẩn theo tài liệu Documentary
AQI_CLASSES = [
    "Good",
    "Moderate",
    "Unhealthy for Sensitive Groups",
    "Unhealthy",
    "Very Unhealthy",
    "Hazardous",
]

AQI_BINS = [-np.inf, 50, 100, 150, 200, 300, np.inf]

AQI_RECOMMENDATIONS = {
    "Good": {
        "label_vi": "Tốt",
        "action_general": "Khí quyển trong lành, an toàn cho tất cả mọi người.",
        "action_sensitive": "Chất lượng không khí lý tưởng cho mọi hoạt động ngoài trời.",
    },
    "Moderate": {
        "label_vi": "Trung bình",
        "action_general": "Chất lượng không khí chấp nhận được. Mọi người có thể sinh hoạt bình thường.",
        "action_sensitive": "Nhóm cực kỳ nhạy cảm nên chú ý nếu có biểu hiện ho hoặc khó thở.",
    },
    "Unhealthy for Sensitive Groups": {
        "label_vi": "Kém",
        "action_general": "Người bình thường vẫn có thể tham gia hoạt động ngoài trời.",
        "action_sensitive": "Cảnh báo sớm: Trẻ em, người cao tuổi và người có bệnh hen suyễn/hô hấp nên hạn chế vận động mạnh ngoài trời.",
    },
    "Unhealthy": {
        "label_vi": "Xấu",
        "action_general": "Cảnh báo toàn dân: Mọi người nên đeo khẩu trang chuyên dụng chống bụi mịn khi ra ngoài.",
        "action_sensitive": "Nhóm nhạy cảm cần tránh ra ngoài; đóng kín cửa sổ và sử dụng máy lọc không khí.",
    },
    "Very Unhealthy": {
        "label_vi": "Rất xấu",
        "action_general": "Cảnh báo khẩn cấp: Hạn chế tối đa các hoạt động ngoài trời, hoãn các sự kiện thể thao công cộng.",
        "action_sensitive": "Nhóm nhạy cảm phải ở trong nhà hoàn toàn, luôn chuẩn bị sẵn thuốc xịt/thuốc dự phòng.",
    },
    "Hazardous": {
        "label_vi": "Nguy hại",
        "action_general": "Cảnh báo nguy hiểm cấp độ cao: Mọi người dân ở yên trong nhà, bật lọc khí tối đa.",
        "action_sensitive": "Nguy hiểm nghiêm trọng đến tính mạng với người bệnh hô hấp và tim mạch.",
    },
}


def aqi_to_class(aqi_values):
    """Gán nhãn phân loại theo 6 cấp độ AQI chuẩn."""
    return pd.cut(aqi_values, bins=AQI_BINS, labels=AQI_CLASSES)


def get_season(month):
    """Xác định mùa dựa trên tháng (Bắc bán cầu)."""
    if month in [3, 4, 5]:
        return 0  # Spring
    elif month in [6, 7, 8]:
        return 1  # Summer
    elif month in [9, 10, 11]:
        return 2  # Autumn
    else:
        return 3  # Winter


def prepare_features(df):
    """
    Tạo các đặc trưng dự báo cho 2 ngày tới (48h tới):
    - Ngày thứ hiện tại và ngày thứ tại thời điểm dự báo (target_dow: T2 đầu tuần vs CN).
    - Cờ cuối tuần hiện tại và tương lai.
    - Giờ trong ngày (hour), tháng (month), mùa (season).
    - Xu hướng tăng giảm (trend / acceleration) của nồng độ ô nhiễm.
    - Các đặc trưng trễ (lags) 24h, 48h và trung bình trượt 24h.
    """
    df = df.copy()
    df["datetime"] = pd.to_datetime(df["datetime"])
    df = df.sort_values(["station", "datetime"]).reset_index(drop=True)

    # 1. Đặc trưng thời gian hiện tại
    df["dayofweek"] = df["datetime"].dt.dayofweek  # 0=Mon, 6=Sun
    df["is_weekend"] = df["dayofweek"].apply(lambda x: 1 if x in [5, 6] else 0)
    df["month"] = df["datetime"].dt.month
    df["hour"] = df["datetime"].dt.hour
    df["season"] = df["month"].apply(get_season)

    # 2. Đặc trưng tại thời điểm mục tiêu (sau 48h / 2 ngày tới)
    target_dt = df["datetime"] + pd.Timedelta(hours=48)
    df["target_dayofweek"] = target_dt.dt.dayofweek
    df["target_is_weekend"] = df["target_dayofweek"].apply(lambda x: 1 if x in [5, 6] else 0)
    df["target_month"] = target_dt.dt.month

    # Mã hoá trạm đo và hướng gió
    stations = sorted(df["station"].unique())
    station_map = {s: i for i, s in enumerate(stations)}
    df["station_code"] = df["station"].map(station_map)

    wd_list = sorted(df["wd"].dropna().unique())
    wd_map = {w: i for i, w in enumerate(wd_list)}
    df["wd_code"] = df["wd"].map(wd_map).fillna(-1)

    # 3. Đặc trưng trễ và trung bình trượt theo từng trạm
    grouped = df.groupby("station")
    df["aqi_lag_24h"] = grouped["AQI"].shift(24)
    df["aqi_lag_48h"] = grouped["AQI"].shift(48)
    df["pm25_lag_24h"] = grouped["PM2.5"].shift(24)
    df["pm10_lag_24h"] = grouped["PM10"].shift(24)

    # Xu hướng thay đổi 24h gần nhất
    df["aqi_trend_24h"] = df["AQI"] - df["aqi_lag_24h"]

    # Trung bình trượt 24h
    df["aqi_roll_24h_mean"] = (
        grouped["AQI"]
        .transform(lambda s: s.shift(1).rolling(window=24, min_periods=1).mean())
    )
    df["pm25_roll_24h_mean"] = (
        grouped["PM2.5"]
        .transform(lambda s: s.shift(1).rolling(window=24, min_periods=1).mean())
    )

    # Mục tiêu dự báo: AQI sau 48h (2 ngày tới)
    df["target_aqi_48h"] = grouped["AQI"].shift(-48)

    return df, station_map, wd_map


def train_and_evaluate(dataset_path=DEFAULT_DATASET):
    """
    Huấn luyện mô hình Gradient Boosting với tỷ lệ 80% train, 20% test theo thời gian.
    Dự báo chất lượng không khí 2 ngày tới.
    """
    print(f"=== Đang đọc dữ liệu từ {dataset_path} ===")
    df = pd.read_csv(dataset_path)

    print("=== Đang trích xuất đặc trưng (Feature Engineering) ===")
    df, station_map, wd_map = prepare_features(df)

    # Lọc bỏ các dòng NaN ở lag và target để đánh giá chính xác
    clean_df = df.dropna(
        subset=["target_aqi_48h", "aqi_lag_24h", "aqi_lag_48h", "AQI"]
    ).reset_index(drop=True)

    feature_cols = [
        "station_code",
        "dayofweek",
        "is_weekend",
        "target_dayofweek",
        "target_is_weekend",
        "target_month",
        "hour",
        "month",
        "season",
        "AQI",
        "PM2.5",
        "PM10",
        "SO2",
        "NO2",
        "CO",
        "O3",
        "TEMP",
        "PRES",
        "DEWP",
        "RAIN",
        "WSPM",
        "wd_code",
        "aqi_lag_24h",
        "aqi_lag_48h",
        "pm25_lag_24h",
        "pm10_lag_24h",
        "aqi_trend_24h",
        "aqi_roll_24h_mean",
        "pm25_roll_24h_mean",
    ]

    # Chia 80% train, 20% test theo thời gian
    clean_df = clean_df.sort_values("datetime").reset_index(drop=True)
    n_rows = len(clean_df)
    split_idx = int(n_rows * 0.8)

    train_data = clean_df.iloc[:split_idx]
    test_data = clean_df.iloc[split_idx:]

    X_train = train_data[feature_cols]
    y_train = train_data["target_aqi_48h"]

    X_test = test_data[feature_cols]
    y_test = test_data["target_aqi_48h"]

    print(f"Số mẫu Train: {len(X_train)} (80%)")
    print(f"Số mẫu Test:  {len(X_test)} (20%)")
    print(f"Khoảng thời gian Train: {train_data['datetime'].min()} -> {train_data['datetime'].max()}")
    print(f"Khoảng thời gian Test:  {test_data['datetime'].min()} -> {test_data['datetime'].max()}")

    print("\n=== Đang huấn luyện mô hình Gradient Boosting (Dự báo AQI 2 ngày tới) ===")
    model = HistGradientBoostingRegressor(
        max_iter=120,
        learning_rate=0.08,
        max_depth=7,
        random_state=42,
    )
    model.fit(X_train, y_train)

    print("=== Đánh giá mô hình trên tập Test (20%) ===")
    predictions = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, predictions))
    rmse = float(root_mean_squared_error(y_test, predictions))

    y_test_class = aqi_to_class(y_test)
    pred_class = aqi_to_class(predictions)

    acc = float(accuracy_score(y_test_class, pred_class))
    report_dict = classification_report(
        y_test_class,
        pred_class,
        labels=AQI_CLASSES,
        target_names=AQI_CLASSES,
        output_dict=True,
        zero_division=0,
    )

    print(f"MAE:  {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"Accuracy (6 mức AQI): {acc:.4f} ({acc*100:.2f}%)")
    print("\nBáo cáo phân loại chi tiết (Classification Report):")
    print(classification_report(
        y_test_class,
        pred_class,
        labels=AQI_CLASSES,
        target_names=AQI_CLASSES,
        zero_division=0,
    ))

    # Định dạng metadata mô hình theo API Section 4.1 trong Documentary
    metadata = {
        "version": "v3.2.1",
        "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "model_type": "GradientBoostingRegressor (Multi-Horizon 48h AQI)",
        "model_metrics": {
            "rows_used": n_rows,
            "training_rows": len(X_train),
            "testing_rows": len(X_test),
            "test_fraction": 0.2,
            "training_end": str(train_data["datetime"].max()),
            "testing_start": str(test_data["datetime"].min()),
            "accuracy": acc,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
        },
        "classification_report": {
            cls_name: {
                "precision": report_dict[cls_name]["precision"],
                "recall": report_dict[cls_name]["recall"],
                "f1-score": report_dict[cls_name]["f1-score"],
                "support": float(report_dict[cls_name]["support"]),
            }
            for cls_name in AQI_CLASSES
        },
    }

    OUTPUT_METRICS_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_METRICS_JSON, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"\n-> Đã lưu metadata mô hình tại: {OUTPUT_METRICS_JSON}")

    # Lưu mô hình đã train
    MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_FILE)
    print(f"-> Đã lưu mô hình tại: {MODEL_FILE}")

    # Sinh dữ liệu dự báo 48h tiếp theo cho 12 trạm đo (Khớp API 4.2)
    generate_48h_forecast(clean_df, model, feature_cols, station_map)

    return model, metadata


def generate_48h_forecast(clean_df, model, feature_cols, station_map):
    """
    Tạo dự báo chi tiết cho 48 giờ tiếp theo (2 ngày tới) cho toàn bộ 12 trạm đo,
    kèm phân lớp và khuyến nghị cá nhân hóa cho nhóm nhạy cảm.
    """
    print("\n=== Đang sinh dữ liệu dự báo 48 giờ (2 ngày tới) cho 12 trạm đo ===")
    
    # Đọc thông tin toạ độ trạm nếu có
    station_meta = {}
    if STATION_LOCATION_CSV.exists():
        loc_df = pd.read_csv(STATION_LOCATION_CSV, sep=";")
        for _, row in loc_df.iterrows():
            station_meta[row["station"]] = {
                "latitude": float(row["Latitude"]),
                "longitude": float(row["Longitude"]),
            }

    # Lấy điểm thời gian mới nhất trong tập test làm mốc bắt đầu dự báo
    latest_time = clean_df["datetime"].max()
    forecasts = []

    # Nhóm theo trạm và lấy dữ liệu 48h gần nhất làm cơ sở dự báo
    grouped = clean_df.groupby("station")

    for station_name, group in grouped:
        st_code = station_map[station_name]
        st_id = st_code + 1
        st_loc = station_meta.get(station_name, {"latitude": 0.0, "longitude": 0.0})

        # Lấy 48 mốc thời gian gần nhất của trạm để dự phóng
        sample_rows = group.tail(48).copy().reset_index(drop=True)
        
        preds = model.predict(sample_rows[feature_cols])

        for h in range(len(preds)):
            target_dt = latest_time + datetime.timedelta(hours=h + 1)
            pred_aqi = max(5.0, round(float(preds[h]), 1))
            
            # Gán phân lớp AQI
            pred_cat = "Good"
            for i in range(len(AQI_BINS) - 1):
                if AQI_BINS[i] < pred_aqi <= AQI_BINS[i + 1]:
                    pred_cat = AQI_CLASSES[i]
                    break

            recom = AQI_RECOMMENDATIONS[pred_cat]

            forecasts.append({
                "station_id": st_id,
                "station_name": station_name,
                "latitude": st_loc["latitude"],
                "longitude": st_loc["longitude"],
                "target_time": target_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "forecast_hour": h + 1,
                "forecast_day": 1 if (h + 1) <= 24 else 2,
                "predicted_aqi": pred_aqi,
                "predicted_class": pred_cat,
                "label_vi": recom["label_vi"],
                "action_general": recom["action_general"],
                "action_sensitive": recom["action_sensitive"],
            })

    output_payload = {
        "model_id": 1,
        "version": "v3.2.1",
        "generated_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "base_datetime": str(latest_time),
        "forecast_horizon_hours": 48,
        "total_stations": len(station_map),
        "total_forecast_records": len(forecasts),
        "forecasts": forecasts,
    }

    OUTPUT_FORECAST_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FORECAST_JSON, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2, ensure_ascii=False)

    print(f"-> Đã ghi {len(forecasts)} bản ghi dự báo 48h vào: {OUTPUT_FORECAST_JSON}")

    # Đồng thời sao chép file dự báo vào thư mục frontend Dashboard/data để frontend tải trực tiếp
    frontend_data_dir = ROOT_DIR / "Dashboard" / "data"
    frontend_data_dir.mkdir(parents=True, exist_ok=True)
    fe_forecast_json = frontend_data_dir / "forecast_48h.json"
    with open(fe_forecast_json, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2, ensure_ascii=False)
    print(f"-> Đã đồng bộ sang Frontend Dashboard tại: {fe_forecast_json}")


def main():
    parser = argparse.ArgumentParser(description="Huấn luyện mô hình Gradient Boosting dự báo AQI")
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET,
        help="Đường dẫn file CSV dữ liệu quan trắc",
    )
    args = parser.parse_args()
    train_and_evaluate(args.dataset)


if __name__ == "__main__":
    main()
