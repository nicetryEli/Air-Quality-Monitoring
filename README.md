# 🌿 HỆ THỐNG CẢNH BÁO SỚM Ô NHIỄM KHÔNG KHÍ (AQI) & LẬP KẾ HOẠCH DI CHUYỂN CHO NHÓM NHẠY CẢM

> **Hệ thống Quan trắc, Dự báo Ô nhiễm Không khí 48h và Hỗ trợ Lập Kế hoạch Di chuyển Thông minh**  
> Dự án phục vụ nghiên cứu giám sát môi trường và bảo vệ sức khỏe cộng đồng hợp tác cùng **Sở Tài nguyên & Môi trường Thành phố**.

---

## 📖 MỤC LỤC
1. [Giới thiệu Tổng quan](#-giới-thiệu-tổng-quan)
2. [Tính năng Nổi bật](#-tính-năng-nổi-bật)
3. [Cấu trúc Thư mục Dự án](#-cấu-trúc-thư-mục-dự-án)
4. [Tài liệu Kỹ thuật Chi tiết](#-tài-liệu-kỹ-thuật-chi-tiết)
5. [Yêu cầu Môi trường (Prerequisites)](#-yêu-cầu-môi-trường-prerequisites)
6. [Hướng dẫn Cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
   - [Bước 1: Huấn luyện Mô hình ML & Dự báo (Python)](#bước-1-huấn-luyện-mô-hình-ml--dự-báo-python)
   - [Bước 2: Khởi chạy Backend RESTful API (Spring Boot)](#bước-2-khởi-chạy-backend-restful-api-spring-boot)
   - [Bước 3: Mở Giao diện Người dùng (Dashboard)](#bước-3-mở-giao-diện-người-dùng-dashboard)
7. [Tóm tắt Danh mục API](#-tóm-tắt-danh-mục-api)
8. [Quy chuẩn Thang đo AQI Quốc tế](#-quy-chuẩn-thang-đo-aqi-quốc-tế)

---

## 📌 GIỚI THIỆU TỔNG QUAN

Hệ thống cung cấp giải pháp trọn gói từ tầng **Khoa học dữ liệu (Data Science / Machine Learning)** đến tầng **Dịch vụ nghiệp vụ (Backend RESTful Service)** và **Giao diện trực quan hóa người dùng (Frontend Responsive Dashboard)**:
- Dự báo chính xác chỉ số chất lượng không khí (AQI) và nồng độ bụi mịn PM2.5, PM10 trong **48 giờ tới** tại 12 trạm quan trắc trọng điểm.
- Hỗ trợ **lập kế hoạch di chuyển theo 24 khung giờ** trong ngày, tự động khoanh vùng khung giờ an toàn (xanh) và khung giờ độc hại cần tránh (đỏ).
- Cá nhân hóa khuyến cáo sức khỏe theo **5 nhóm đối tượng người dùng (Persona)**: Toàn dân, Trẻ em & Học sinh, Người cao tuổi, Người mắc bệnh hô hấp/hen suyễn, và Người lao động/tập thể dục ngoài trời.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Dự báo Chuỗi Thời gian 48 Giờ:**
   * Sử dụng thuật toán học máy `HistGradientBoostingRegressor` phân tích dữ liệu lịch sử hơn 420.000 mẫu quan trắc.
   * Kết hợp chu kỳ thời gian (giờ cao điểm giao thông, chu kỳ ngày/đêm, ngày trong tuần, mùa trong năm) và các yếu tố khí tượng (nhiệt độ, áp suất, độ ẩm, tốc độ gió).
2. **Công cụ Lập Kế hoạch Di chuyển An toàn (Travel Safety Planner):**
   * Phân tích 24 giờ trong ngày, đánh giá mức độ rủi ro sức khỏe cho từng khung giờ di chuyển, gợi ý phương tiện và biện pháp bảo vệ phù hợp.
3. **Cá nhân hóa theo Nhóm Đối tượng (Persona Switching):**
   * Cho phép chuyển đổi nhanh giữa các nhóm đối tượng nhạy cảm. Hệ thống tự động điều chỉnh ngưỡng cảnh báo sớm và đưa ra lời khuyên y khoa thực tế.
4. **Giao diện Dashboard Hiện đại & Trực quan:**
   * Đồng hồ tròn đo AQI mô phỏng trực quan chuẩn quốc tế với kim chỉ thị phi tuyến tính.
   * 6 biểu đồ chuyên sâu: Diễn biến 48h, Phân tích 24h di chuyển, So sánh 12 trạm đo, Hồ sơ đa chất ô nhiễm, Xu hướng lịch sử theo tháng, Tỷ lệ chất lượng không khí trong năm.
   * Hỗ trợ giao diện linh hoạt: Chế độ Sáng / Tối, màu nền bầu trời thay đổi sống động theo thời gian thực trong ngày, tối ưu hiển thị trên Mobile, Tablet và Desktop PC.
5. **Backend RESTful API Mạnh mẽ:**
   * Phát triển trên nền tảng **Java 17 & Spring Boot 3**, tích hợp cơ sở dữ liệu in-memory H2 (sẵn sàng khởi chạy ngay không cần cài đặt SQL server) cùng khả năng chuyển đổi liền mạch sang PostgreSQL cho môi trường production.
   * Cơ chế Ingest API bảo vệ bằng `X-ML-API-KEY` để đồng bộ kết quả dự báo tự động từ Python pipeline.

---

## 📂 CẤU TRÚC THƯ MỤC DỰ ÁN

Mã nguồn và tài liệu đã được tổ chức, phân loại theo tiêu chuẩn kỹ thuật rõ ràng:

```text
AQI monitoring/
├── dataset/                         # Dữ liệu gốc, mô hình ML & kết quả dự báo
│   ├── 1_Master_Data.csv            # Dữ liệu quan trắc 2 năm (~420.768 bản ghi, 12 trạm)
│   ├── 4_AQI_Mapping.csv            # Bảng chuẩn hóa phân cấp AQI
│   ├── 5_Station_Location.csv       # Danh sách và tọa độ 12 trạm quan trắc
│   ├── forecast_48h.json            # File JSON chứa dữ liệu dự báo 48h cho 12 trạm
│   └── gradient_boosting_aqi.joblib # Trọng số mô hình hồi quy Gradient Boosting đã huấn luyện
│
├── gradient_boosting_aqi.py         # Pipeline trích xuất đặc trưng, huấn luyện & kiểm định ML
│
├── docs/                            # Thư mục tài liệu kỹ thuật chuẩn mực
│   ├── SOFTWARE_SPECIFICATION.md    # Tài liệu đặc tả yêu cầu phần mềm (SRS - 10 FRs & 6 NFRs)
│   ├── API_CONTRACT.md              # Đặc tả hợp đồng API RESTful (Endpoints, Request/Response, Error)
│   ├── MODEL_TRAINING_REPORT.md     # Báo cáo chi tiết phương pháp huấn luyện và kết quả đánh giá ML
│   ├── PROJECT_ARCHITECTURE_DOCUMENTATION.md # Tài liệu kiến trúc hệ thống và luồng dữ liệu
│   ├── model_metadata.json          # Chỉ số đánh giá mô hình thực nghiệm (MAE, RMSE, R2, Metrics)
│   ├── UserStories_GherkinBDD.xlsx  # Kịch bản kiểm thử hành vi BDD (Cucumber/Gherkin)
│   └── aqi_system_erd_v3.html.pdf   # Sơ đồ quan hệ thực thể cơ sở dữ liệu (ERD)
│
├── demo/                            # Ứng dụng Backend Spring Boot 3
│   ├── pom.xml                      # Cấu hình Maven & dependencies (Web, JPA, H2, Lombok, Validation)
│   └── src/
│       ├── main/java/com/example/demo/
│       │   ├── config/              # Cấu hình CORS, DataInitializer nạp dữ liệu tự động
│       │   ├── controller/          # REST Controllers tiếp nhận request
│       │   ├── dto/                 # Data Transfer Objects (Request/Response payload)
│       │   ├── entity/              # JPA Entities (Station, AirQualityReading, HourlyAdvisory, ...)
│       │   ├── exception/           # Bộ xử lý ngoại lệ toàn cục (GlobalExceptionHandler)
│       │   ├── repository/          # Spring Data JPA Repositories
│       │   └── service/             # Business Logic Services
│       └── main/resources/
│           ├── application.properties        # Cấu hình chính (chọn active profile)
│           ├── application-local.properties  # Cấu hình môi trường Local (H2 in-memory)
│           └── application-prod.properties   # Cấu hình môi trường Production (PostgreSQL)
│
├── Dashboard/                       # Ứng dụng Frontend Dashboard người dùng
│   ├── index.html                   # Trang chủ hiển thị Dashboard
│   ├── css/                         # Thiết kế CSS phân tách module (base, cards, modal, responsive)
│   ├── js/                          # Mã điều khiển Javascript (app, charts, gauge, dynamic sky)
│   └── data/                        # Dữ liệu tĩnh dự phòng (offline mode)
│
└── README.md                        # Hướng dẫn tổng quan dự án (file này)
```

---

## 📚 TÀI LIỆU KỸ THUẬT CHI TIẾT

Toàn bộ tài liệu chi tiết phục vụ phát triển, nghiệm thu và tích hợp nằm trong thư mục `docs/`:

1. [Đặc tả Yêu cầu Phần mềm (Software Specification / SRS)](docs/SOFTWARE_SPECIFICATION.md): Mô tả đầy đủ 10 yêu cầu chức năng (FR-01 đến FR-10), 6 yêu cầu phi chức năng, 5 Persona người dùng và mô hình dữ liệu.
2. [Hợp đồng API RESTful (API Contract)](docs/API_CONTRACT.md): Tài liệu kỹ thuật định nghĩa chi tiết 9 endpoint REST, cấu trúc JSON Request/Response, tham số truy vấn, mã lỗi HTTP và cơ chế xác thực API Key.
3. [Báo cáo Huấn luyện & Đánh giá Mô hình ML (Model Training Report)](docs/MODEL_TRAINING_REPORT.md): Phân tích bài toán dự báo 48h, 38 đặc trưng trích xuất (lags, rolling, chu kỳ, khí tượng), chiến lược Time-Series Split 80/20 và kết quả thực nghiệm (MAE: 68.25, RMSE: 92.87, độ chính xác phân cấp F1-score).
4. [Tài liệu Kiến trúc Hệ thống (Project Architecture)](docs/PROJECT_ARCHITECTURE_DOCUMENTATION.md): Sơ đồ luồng dữ liệu 3 tầng (ML Pipeline -> Spring Boot Backend -> Frontend Client).
5. [Nghiên Cứu Lý Thuyết & Thực Nghiệm Đánh Giá Mô Hình (Jupyter Notebook)](docs/Model_Theory_and_Performance_Evaluation.ipynb): Trình bày toàn diện nền tảng toán học của thuật toán Gradient Boosting, công thức toán học, lý giải nguyên nhân vật lý/khí quyển của 38 đặc trưng, cùng các biểu đồ trực quan hóa sai số thực nghiệm, khoảng tin cậy 95%, tầm quan trọng đặc trưng và ma trận nhầm lẫn phân cấp 6 mức AQI.

---

## 💻 YÊU CẦU MÔI TRƯỜNG (PREREQUISITES)

Để chạy trọn vẹn toàn bộ hệ thống, máy tính của bạn cần cài đặt:
- **Python**: Phiên bản 3.10 trở lên (đã kiểm thử tương thích với Python 3.10 - 3.13).
- **Java Development Kit (JDK)**: Phiên bản 17 LTS trở lên.
- **Apache Maven**: Phiên bản 3.8 trở lên (hoặc sử dụng wrapper nếu có).
- **Trình duyệt Web hiện đại**: Google Chrome, Microsoft Edge, Mozilla Firefox hoặc Safari.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

Hệ thống có thể khởi chạy độc lập từng phần hoặc chạy toàn diện theo 3 bước tuần tự dưới đây:

### Bước 1: Huấn luyện Mô hình ML & Dự báo (Python)

Bước này đọc dữ liệu quan trắc `dataset/1_Master_Data.csv`, tạo 38 đặc trưng chuỗi thời gian, huấn luyện mô hình Gradient Boosting, xuất chỉ số kiểm định và tạo file dự báo 48 giờ.

1. Cài đặt các thư viện Python cần thiết:
   ```bash
   pip install pandas numpy scikit-learn joblib
   ```
2. Chạy kịch bản huấn luyện:
   ```bash
   python gradient_boosting_aqi.py
   ```
   *(Trên hệ thống Windows có nhiều phiên bản Python, bạn có thể dùng lệnh `py -3.13 gradient_boosting_aqi.py`)*
3. **Kết quả tạo ra:**
   - Trọng số mô hình: `dataset/gradient_boosting_aqi.joblib`
   - File kết quả dự báo: `dataset/forecast_48h.json` và `Dashboard/data/forecast_48h.json`
   - Metadata đánh giá kiểm thử: `docs/model_metadata.json`

---

### Bước 2: Khởi chạy Backend RESTful API (Spring Boot)

Backend Spring Boot cung cấp các REST API cho Frontend Dashboard và tự động nạp danh sách 12 trạm cùng dữ liệu dự báo 48h khi khởi động.

1. Di chuyển vào thư mục `demo`:
   ```bash
   cd demo
   ```
2. Khởi chạy ứng dụng bằng Maven:
   ```bash
   mvn spring-boot:run
   ```
3. **Thông tin dịch vụ sau khi khởi chạy:**
   - Server URL: `http://localhost:8080`
   - Kiểm tra trạng thái hệ thống (Health Check):
     ```bash
     curl http://localhost:8080/api/v1/stations
     ```
   - H2 Database In-Memory Console: `http://localhost:8080/h2-console`
     - **JDBC URL:** `jdbc:h2:mem:aqidb`
     - **User Name:** `sa`
     - **Password:** *(để trống)*

*(Mẹo: Khi triển khai Production, chỉ cần đổi cấu hình `spring.profiles.active=prod` trong `application.properties` và cấu hình kết nối PostgreSQL trong `application-prod.properties`)*.

---

### Bước 3: Mở Giao diện Người dùng (Dashboard)

Giao diện Dashboard được tối ưu hiển thị dữ liệu từ Backend hoặc có thể tự động fallback sang file JSON tĩnh nếu Backend chưa mở.

- **Cách 1 - Khuyên dùng (Chạy Local Web Server):**
  Mở terminal mới tại thư mục gốc dự án:
  ```bash
  cd Dashboard
  python -m http.server 5500
  ```
  Sau đó mở trình duyệt web và truy cập địa chỉ:
  👉 **`http://localhost:5500`**

- **Cách 2 - Mở trực tiếp (Direct File Access):**
  Nhấp đúp chuột vào file `Dashboard/index.html` hoặc kéo thả file này vào trình duyệt web bất kỳ.

---

## 📡 TÓM TẮT DANH MỤC API

Dưới đây là các Endpoint chính được Backend Spring Boot cung cấp (xem chi tiết tại [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)):

| Nhóm | Phương thức | Endpoint | Mô tả chức năng |
| :--- | :---: | :--- | :--- |
| **Trạm quan trắc** | `GET` | `/api/v1/stations` | Lấy danh sách 12 trạm quan trắc và tọa độ địa lý |
| | `GET` | `/api/v1/stations/{id}` | Lấy thông tin chi tiết của một trạm quan trắc |
| **Số liệu AQI** | `GET` | `/api/v1/aqi/current?stationId={id}` | Lấy giá trị AQI và nồng độ chất ô nhiễm hiện tại |
| | `GET` | `/api/v1/aqi/forecast?stationId={id}` | Lấy chuỗi dự báo chất lượng không khí 48 giờ tiếp theo |
| | `GET` | `/api/v1/aqi/hourly?stationId={id}&date={YYYY-MM-DD}` | Lấy diễn biến dữ liệu theo từng giờ trong ngày |
| | `GET` | `/api/v1/aqi/stations-summary` | So sánh nhanh chỉ số AQI giữa tất cả 12 trạm |
| **Khuyến nghị** | `GET` | `/api/v1/advisory/travel-plan?stationId={id}&persona={code}` | Lấy kế hoạch di chuyển 24h tối ưu theo từng nhóm đối tượng |
| **Nạp số liệu ML** | `POST` | `/api/v1/internal/ml-predictions` | Ingest chuỗi dự báo từ Python Model (Yêu cầu `X-ML-API-KEY`) |
| **Quản trị** | `GET` | `/api/v1/admin/dashboard/stats` | Thống kê số lượng trạm, mẫu ghi nhận và trạng thái nạp dữ liệu |

---

## 📊 QUY CHUẨN THANG ĐO AQI QUỐC TẾ

Hệ thống tuân thủ theo thang đo quy chuẩn quốc tế US EPA và Quy chuẩn kỹ thuật quốc gia về môi trường Việt Nam (QCVN 05:2023/BTNMT):

| Khoảng AQI | Phân lớp chất lượng | Màu sắc hiển thị | Khuyến nghị sức khỏe cộng đồng |
| :---: | :---: | :---: | :--- |
| **0 – 50** | **Tốt (Good)** | 🟢 Xanh lục | Không khí sạch, trong lành; mọi hoạt động ngoài trời đều an toàn. |
| **51 – 100** | **Trung bình (Moderate)** | 🟡 Vàng | Chất lượng chấp nhận được; nhóm quá nhạy cảm nên chú ý nếu có triệu chứng khó thở. |
| **101 – 150** | **Kém (Sensitive)** | 🟠 Cam | **Cảnh báo sớm:** Trẻ em, người cao tuổi và người mắc bệnh hô hấp nên giảm hoạt động ngoài trời kéo dài. |
| **151 – 200** | **Xấu (Unhealthy)** | 🔴 Đỏ | **Cảnh báo toàn dân:** Bắt đầu ảnh hưởng xấu đến sức khỏe mọi người. Nên đeo khẩu trang chống bụi N95 khi ra ngoài. |
| **201 – 300** | **Rất xấu (Very Unhealthy)** | 🟣 Tím | **Cảnh báo khẩn cấp:** Mọi người hạn chế tối đa ra đường; các trường học và khu dân cư nên hạn chế hoạt động thể chất ngoài trời. |
| **> 300** | **Nguy hại (Hazardous)** | 🟤 Nâu đỏ | **Báo động cấp độ nghiêm trọng:** Nguy hiểm cho toàn bộ dân cư; ở yên trong nhà, đóng kín cửa sổ và bật thiết bị lọc không khí. |

---

## 👥 BẢN QUYỀN & THÔNG TIN DỰ ÁN

- **Đơn vị phối hợp:** Nhóm nghiên cứu Dữ liệu Môi trường & Sở Tài nguyên và Môi trường Thành phố.
- **Mã nguồn:** Lưu trữ nội bộ phục vụ đề tài nghiên cứu quan trắc chất lượng không khí đô thị.
- **Giấy phép:** Phục vụ mục đích học thuật và nghiên cứu cộng đồng.
