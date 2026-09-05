import pandas as pd
import glob
from pathlib import Path

# ============================================================
# 1. ĐỌC & GỘP 12 FILE
# ============================================================
files = sorted(glob.glob('PRSA_Data_*.csv'))   # chạy trong thư mục chứa 12 file CSV
print(f"Số file tìm thấy: {len(files)}")

dfs = []
for f in files:
    df = pd.read_csv(f, na_values=['NA', 'NaN', ''])
    dfs.append(df)
    print(f"  - {Path(f).name}: {len(df):,} dòng")

df = pd.concat(dfs, ignore_index=True)
print(f"\nTổng số dòng sau khi gộp: {len(df):,}")

# ============================================================
# 2. TẠO CỘT DATETIME
# ============================================================
df['datetime'] = pd.to_datetime(df[['year', 'month', 'day', 'hour']])

# ============================================================
# 3. SẮP XẾP THEO STATION + THỜI GIAN
# ============================================================
df = df.sort_values(['station', 'datetime']).reset_index(drop=True)

# ============================================================
# 4. XỬ LÝ MISSING VALUES
# ============================================================
print("\n=== Missing values TRƯỚC khi xử lý ===")
print(df.isna().sum())

meteo_cols = ['TEMP', 'PRES', 'DEWP', 'RAIN', 'WSPM']
pollutant_cols = ['PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3']

df_clean = df.copy()

for station, group in df_clean.groupby('station'):
    idx = group.index
    # Interpolate khí tượng (giới hạn 3 giờ)
    df_clean.loc[idx, meteo_cols] = (
        group[meteo_cols]
        .interpolate(method='linear', limit=3, limit_direction='both')
    )
    # Fill hướng gió
    df_clean.loc[idx, 'wd'] = group['wd'].ffill().bfill()

# Xử lý nốt các giá trị còn sót
for col in meteo_cols:
    df_clean[col] = df_clean[col].interpolate(method='linear', limit_direction='both')

print("\n=== Missing values SAU khi xử lý ===")
print(df_clean.isna().sum())

# ============================================================
# 5. CHUẨN HÓA KIỂU DỮ LIỆU
# ============================================================
for col in pollutant_cols + meteo_cols:
    df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')

# ============================================================
# 6. CHỌN CỘT & SẮP XẾP LẠI
# ============================================================
cols_order = [
    'datetime', 'year', 'month', 'day', 'hour',
    'PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3',
    'TEMP', 'PRES', 'DEWP', 'RAIN', 'wd', 'WSPM', 'station'
]
df_final = df_clean[cols_order].copy()

# ============================================================
# 7. LƯU FILE SẠCH (lưu ngay trong thư mục hiện tại)
# ============================================================
output_path = 'PRSA_Beijing_AirQuality_Cleaned.csv'
df_final.to_csv(output_path, index=False)

print(f"\n✅ Đã lưu file sạch: {output_path}")
print(f"   Số dòng : {len(df_final):,}")
print(f"   Số cột  : {len(df_final.columns)}")

# ============================================================
# 8. THỐNG KÊ NHANH
# ============================================================
print("\n=== Thống kê các chất ô nhiễm ===")
print(df_final[pollutant_cols].describe().round(1))

print("\n=== Số bản ghi theo từng trạm ===")
print(df_final['station'].value_counts().sort_index())