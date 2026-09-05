import pandas as pd
import glob
from pathlib import Path
import os

# ============================================================
# 1. TẠO THƯ MỤC LƯU FILE SẠCH
# ============================================================
output_dir = "cleaned_stations"
os.makedirs(output_dir, exist_ok=True)

# ============================================================
# 2. ĐỌC TỪNG FILE VÀ LÀM SẠCH RIÊNG
# ============================================================
files = sorted(glob.glob('PRSA_Data_*.csv'))
print(f"Số file tìm thấy: {len(files)}\n")

for f in files:
    # Đọc file
    df = pd.read_csv(f, na_values=['NA', 'NaN', ''])
    station_name = df['station'].iloc[0]   # lấy tên trạm
    
    print(f"Đang xử lý: {station_name} ({len(df):,} dòng)")
    
    # ----- Tạo datetime -----
    df['datetime'] = pd.to_datetime(df[['year', 'month', 'day', 'hour']])
    
    # ----- Sắp xếp theo thời gian -----
    df = df.sort_values('datetime').reset_index(drop=True)
    
    # ----- Xử lý missing values -----
    meteo_cols = ['TEMP', 'PRES', 'DEWP', 'RAIN', 'WSPM']
    pollutant_cols = ['PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3']
    
    # Interpolate khí tượng (giới hạn 3 giờ)
    df[meteo_cols] = df[meteo_cols].interpolate(
        method='linear', limit=3, limit_direction='both'
    )
    
    # Fill hướng gió
    df['wd'] = df['wd'].ffill().bfill()
    
    # Xử lý nốt nếu còn sót
    for col in meteo_cols:
        df[col] = df[col].interpolate(method='linear', limit_direction='both')
    
    # ----- Chuẩn hóa kiểu dữ liệu -----
    for col in pollutant_cols + meteo_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # ----- Chọn cột -----
    cols_order = [
        'datetime', 'year', 'month', 'day', 'hour',
        'PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3',
        'TEMP', 'PRES', 'DEWP', 'RAIN', 'wd', 'WSPM', 'station'
    ]
    df_clean = df[cols_order].copy()
    
    # ----- Lưu file riêng cho từng trạm -----
    output_path = os.path.join(output_dir, f"Cleaned_{station_name}.csv")
    df_clean.to_csv(output_path, index=False)
    
    print(f"  → Đã lưu: {output_path}")
    print(f"     Missing còn lại: {df_clean.isna().sum().sum()} giá trị\n")

print("✅ Hoàn tất! Đã tạo 12 file sạch trong thư mục 'cleaned_stations'")