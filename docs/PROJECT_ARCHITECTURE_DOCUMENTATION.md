# TÀI LIỆU KIẾN TRÚC & HƯỚNG DẪN KỸ THUẬT TOÀN DIỆN DỰ ÁN
## Hệ Thống Cảnh Báo Sớm Ô Nhiễm Không Khí (AQI) & Lập Kế Hoạch Di Chuyển Cho Nhóm Nhạy Cảm

---

## 1. TỔNG QUAN DỰ ÁN

* **Đề tài:** Dự báo ô nhiễm không khí (AQI) theo thời gian thực và lập kế hoạch di chuyển tối ưu cho nhóm nhạy cảm.
* **Bối cảnh:** Hợp tác cùng Sở Tài nguyên & Môi trường thành phố phân tích dữ liệu quan trắc không khí 2 năm tại 12 trạm đo, nhằm xác định nguồn ô nhiễm chính theo mùa, xây dựng hệ thống cảnh báo sớm AQI và hỗ trợ người dân (đặc biệt nhóm nhạy cảm: trẻ em, người cao tuổi, người có bệnh hô hấp/tim mạch) lựa chọn khung giờ và lộ trình di chuyển an toàn nhất.
* **Mục tiêu tổng thể:**
  1. Xây dựng mô hình Machine Learning (Gradient Boosting) dự báo chất lượng không khí trong **2 ngày tới (48 giờ tiếp theo)**.
  2. Xây dựng ứng dụng Frontend Dashboard hiện đại (phong cách Glassmorphism, Responsive 100%) hiển thị trực quan chỉ số AQI, biểu đồ dự báo 48h, và công cụ lập kế hoạch di chuyển theo giờ.
  3. Xây dựng Backend RESTful API (Spring Boot) kết nối cơ sở dữ liệu (hỗ trợ cả H2 in-memory và PostgreSQL), tiếp nhận dự báo tự động từ Python Model và phân phối dữ liệu lên Frontend.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

Dự án được tổ chức đồng bộ và chuẩn hóa thành các module độc lập:

```text
AQI monitoring/
│
├── dataset/                                # Dữ liệu nguồn & kết quả mô hình
│   ├── 1_Master_Data.csv                   # Dữ liệu quan trắc hàng giờ 2 năm (~420.768 dòng, 12 trạm)
│   ├── 2_ML_Predictions.csv               # Bảng đối chiếu dự báo thực tế và baseline
│   ├── 3_Feature_Importance.csv            # Bảng xếp hạng tầm quan trọng của các đặc trưng
│   ├── 4_AQI_Mapping.csv                   # Bảng ngưỡng phân lớp chỉ số AQI tiêu chuẩn
│   ├── 5_Station_Location.csv              # Tọa độ địa lý (Vĩ độ, Kinh độ) 12 trạm đo
│   ├── forecast_48h.json                   # Kết quả dự báo 48h cho 12 trạm (tạo bởi model)
│   └── gradient_boosting_aqi.joblib        # Trọng số mô hình Gradient Boosting đã huấn luyện
│
├── gradient_boosting_aqi.py                # Mã nguồn huấn luyện & sinh dự báo 48h
│
├── Dashboard/                              # Giao diện Frontend cho người dân
│   ├── index.html                          # Trang giao diện chính (HTML5 Semantic)
│   ├── css/
│   │   ├── global.css                      # Phong cách tổng thể, scrollbar, thanh trượt thời gian
│   │   ├── cards.css                       # Thiết kế thẻ Glassmorphism, persona pills, responsive
│   │   └── gauge.css                       # Đồng hồ đo tròn Dark Glass Circular AQI Gauge
│   ├── js/
│   │   ├── charts.js                       # Quản lý 6 biểu đồ Chart.js, persona switcher & API
│   │   ├── gauge.js                        # Điều khiển kim và dải màu của đồng hồ AQI
│   │   ├── cards.js                        # Hiệu ứng tương tác phản chiếu thẻ kính và modal
│   │   └── ocean.js                        # Canvas WebGL nền động màu trời theo thời gian
│   ├── data/
│   │   ├── aqi_daily.json                  # Dữ liệu tổng hợp theo ngày phục vụ frontend
│   │   ├── forecast_48h.json               # Dữ liệu dự báo 48 giờ đồng bộ từ mô hình
│   │   └── preprocess.py                   # Script tổng hợp 1_Master_Data.csv thành aqi_daily.json
│   └── images/                             # Tài nguyên hình ảnh (mây trôi, biểu tượng)
│
├── demo/                                   # Backend RESTful API (Spring Boot 3)
│   ├── pom.xml                             # Cấu hình Maven (Spring Boot, Data JPA, H2, PostgreSQL)
│   └── src/main/
│       ├── java/
│       │   └── com/
│       │       ├── aqi/warning/            # Core business logic
│       │       │   ├── controller/         # REST Controllers (PublicAqiController, MlForecastIngestController...)
│       │       │   ├── dto/                # Data Transfer Objects
│       │       │   ├── entity/             # JPA Entities (Station, AlertEvent, MlModel, AdminAccount)
│       │       │   ├── repository/         # Spring Data JPA Repositories
│       │       │   └── service/            # Business Services & Implementations
│       │       └── example/demo/
│       │           ├── DemoApplication.java# Entry point Spring Boot
│       │           └── config/
│       │               └── DataInitializer.java # Khởi tạo dữ liệu trạm và dự báo khi start
│       └── resources/
│           └── application.yml             # Cấu hình Profile (local H2 in-memory & prod PostgreSQL)
│
└── Documentary/                            # Hồ sơ tài liệu kỹ thuật của dự án
    ├── api_spec_aqi_warning_system_v2.md   # Đặc tả RESTful API & Quy trình tích hợp
    ├── model_metadata.json                 # Metadata huấn luyện và kiểm định chất lượng mô hình
    ├── RestfulApiSpec.ipynb                # Notebook mô phỏng API
    ├── UserStories_GherkinBDD.xlsx         # Kịch bản kiểm thử nghiệm thu BDD (Gherkin)
    └── aqi_system_erd_v3.html.pdf          # Sơ đồ quan hệ thực thể cơ sở dữ liệu (ERD)
```

---

## 3. MÔ HÌNH MACHINE LEARNING (GRADIENT BOOSTING)

### 3.1. Phân chia dữ liệu (Train/Test Split)
* Dữ liệu quan trắc được chia theo thứ tự thời gian (Chronological Time-Series Split) theo tỷ lệ **80% Train, 20% Test**:
  * **Tập Train (80%):** Từ tháng 03/2013 đến tháng 05/2016 (335.692 mẫu).
  * **Tập Test (20%):** Từ tháng 05/2016 đến tháng 02/2017 (83.924 mẫu).

### 3.2. Kỹ thuật trích xuất đặc trưng (Feature Engineering)
Mô hình đặc biệt chú trọng các yếu tố chu kỳ xã hội và thời tiết:
1. **Chu kỳ giao thông tuần (`dayofweek`, `is_weekend`):**
   * Phân biệt rõ ngày Thứ 2 đầu tuần (lưu lượng xe cộ, khí thải giờ cao điểm tăng cao) so với ngày Chủ Nhật (người dân nghỉ ngơi, lưu lượng xe giảm, chất lượng không khí cải thiện).
2. **Đặc trưng thời điểm dự báo (`target_dayofweek`, `target_is_weekend`):**
   * Xác định đúng thứ trong tuần tại mốc $t+48$ giờ tới để áp dụng đúng trọng số giao thông tương lai.
3. **Chu kỳ ngày đêm (`hour`):**
   * Nắm bắt 2 khung giờ cao điểm ô nhiễm đô thị: 07:00 - 09:00 sáng và 17:00 - 19:30 chiều.
4. **Yếu tố mùa (`month`, `season`):**
   * Mùa Đông và đầu Xuân thường xuyên xảy ra hiện tượng nghịch nhiệt (temperature inversion), giam giữ bụi mịn sát mặt đất.
5. **Đặc trưng trễ (Lags & Rolling):**
   * `aqi_lag_24h`, `aqi_lag_48h`, `pm25_lag_24h`, `pm10_lag_24h`.
   * `aqi_trend_24h`: Gia tốc tăng giảm ô nhiễm trong 24 giờ qua.
   * `aqi_roll_24h_mean`, `pm25_roll_24h_mean`: Trung bình trượt 24 giờ.
6. **Khí tượng:** Nhiệt độ (`TEMP`), áp suất (`PRES`), điểm sương (`DEWP`), lượng mưa (`RAIN`), tốc độ gió (`WSPM`), hướng gió (`wd_code`).

### 3.3. Kết quả đầu ra mô hình
* Xuất file `Documentary/model_metadata.json` chứa đầy đủ thông số huấn luyện, RMSE, MAE và Báo cáo phân loại 6 cấp độ AQI chuẩn khớp API Section 4.1.
* Xuất file `dataset/forecast_48h.json` (và đồng bộ sang `Dashboard/data/forecast_48h.json`) chứa 576 bản ghi dự báo chi tiết cho 12 trạm trong 48 giờ tiếp theo.

---

## 4. THIẾT KẾ FRONTEND (DASHBOARD CHO NGƯỜI DÂN)

### 4.1. Hệ thống 6 biểu đồ phục vụ người dân
Thay thế các biểu đồ nghiên cứu hàn lâm (như Scatter tương quan nhiệt độ hay PolarArea hướng gió) bằng các công cụ thiết thực phục vụ quyết định hàng ngày:

1. **Biểu đồ 1: Dự báo AQI 48 giờ tới (2 ngày tiếp theo)**
   * Đường dự báo 48 mốc giờ tương lai sinh ra từ mô hình Gradient Boosting, giúp người dân biết trước xu hướng chất lượng không khí ngày mai và ngày kia.
2. **Biểu đồ 2: Kế hoạch di chuyển theo giờ (24h Safety Travel Planner)**
   * Đồ thị phân tích 24 giờ trong ngày, đánh dấu tự động **Khung giờ vàng an toàn** (cột xanh) và **Khung giờ cao điểm ô nhiễm** (cột đỏ) để người dân chọn giờ ra ngoài.
3. **Biểu đồ 3: So sánh chỉ số AQI 12 trạm toàn thành phố**
   * Biểu đồ so sánh nhanh giữa các trạm đo, hỗ trợ chọn lộ trình qua các quận/khu vực không khí sạch hơn.
4. **Biểu đồ 4: Hồ sơ đa chất ô nhiễm (Radar chart)**
   * Phân tích 6 chất: PM2.5, PM10, SO2, NO2, CO, O3 để chỉ ra tác nhân gây ô nhiễm chủ đạo.
5. **Biểu đồ 5: Xu hướng PM2.5 theo 12 tháng**
   * Đánh giá biến thiên theo mùa và phát hiện mùa nghịch nhiệt ô nhiễm cao điểm.
6. **Biểu đồ 6: Tỷ lệ ngày Tốt/Xấu cả năm (Doughnut chart)**
   * Thống kê tỷ lệ phân bổ số ngày theo 6 cấp độ AQI trong năm đã chọn.

### 4.2. Bộ chuyển đối tượng nhạy cảm (Persona Switcher)
Cho phép người dân tùy chọn đối tượng quan sát:
* **Toàn dân (General Public):** Kích hoạt cảnh báo khi AQI > 150.
* **Trẻ em & Học sinh:** Kích hoạt cảnh báo sớm khi AQI > 100; gợi ý điều chỉnh giờ học thể dục và đeo khẩu trang lọc bụi.
* **Người cao tuổi:** Kích hoạt cảnh báo sớm khi AQI > 100; khuyến cáo tránh tập thể dục sáng sớm khi có nghịch nhiệt/sương mù.
* **Bệnh hô hấp & Hen suyễn:** Kích hoạt cảnh báo khẩn khi AQI > 100; khuyến cáo chuẩn bị thuốc cắt cơn và bật máy lọc không khí HEPA.

---

## 5. BACKEND RESTFUL API & TÍCH HỢP HỆ THỐNG

### 5.1. Danh mục các Endpoint chính
* `GET /api/v1/stations`: Lấy danh sách 12 trạm quan trắc và tọa độ địa lý.
* `GET /api/v1/aqi/current?stationId={id}`: Lấy chất lượng không khí hiện tại và phân lớp AQI.
* `GET /api/v1/aqi/forecast?stationId={id}`: Lấy dữ liệu dự báo 48 giờ từ mô hình Machine Learning.
* `GET /api/v1/advisory/travel-plan?stationId={id}&persona={type}`: Lấy lịch trình khuyến nghị khung giờ an toàn cho nhóm nhạy cảm.
* `POST /api/v1/internal/ml-predictions`: Tiếp nhận dữ liệu dự báo tự động đẩy từ mô hình Python vào cơ sở dữ liệu và kích hoạt cảnh báo sớm.

### 5.2. Cấu hình cơ sở dữ liệu linh hoạt
Backend được thiết kế với 2 profiles:
1. **Profile `local` (Mặc định):** Sử dụng H2 In-Memory Database (tương thích cú pháp PostgreSQL), tự động nạp dữ liệu trạm và dự báo khi khởi động. Không cần cài đặt phần mềm bên ngoài.
2. **Profile `prod`:** Kết nối PostgreSQL theo biến môi trường `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`.
