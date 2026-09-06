# Air Quality Monitoring & Early Warning System 🌍💨
> **Hệ thống Quan trắc & Cảnh báo Sớm Chất lượng Không khí**  
> Dự án hợp tác chiến lược cùng **Sở Tài nguyên & Môi trường (DONRE)** nhằm phân tích dữ liệu khí tượng, xác định nguồn ô nhiễm chính theo mùa và cung cấp giải pháp bảo vệ sức khỏe cộng đồng thông qua Trí tuệ Nhân tạo.

---

## 📌 Tổng Quan Dự Án
Dự án được xây dựng dựa trên dữ liệu quan trắc không khí lịch sử **2 năm** liên tục từ **12 trạm đo** tiêu chuẩn. Mục tiêu cốt lõi của hệ thống bao gồm:
1. **Phân tích Chuyên sâu (DONRE):** Hỗ trợ cán bộ quản lý môi trường trực quan hóa bản đồ nhiệt (Heatmap), vẽ biểu đồ Hoa hồng gió (Wind Rose) xác định nguồn phát thải, tự động làm sạch và nội suy dữ liệu khuyết thiếu.
2. **Dự báo & Cảnh báo Sớm (Người dân):** Tích hợp mô hình học máy (Machine Learning) phân loại 6 cấp độ AQI để đưa ra dự báo trước 24-48 giờ.
3. **Cá nhân hóa cho Nhóm nhạy cảm:** Thiết lập cơ chế cảnh báo riêng biệt (ngưỡng thấp hơn kèm khuyến nghị hành động cụ thể) cho trẻ em, người già và người có tiền sử bệnh hô hấp (hen suyễn, tim mạch).

---

## 🛠️ Kiến Trúc Hệ Thống & Cơ Sở Dữ Liệu (ERD)

Hệ thống được thiết kế theo mô hình Microservices/SOA gọn nhẹ, kết nối chặt chẽ giữa dịch vụ thu thập (Data Ingestion), phân tích học máy (ML Inference Service), và lõi xử lý nghiệp vụ (Backend API).

### Sơ đồ Quan hệ Thực thể (ERD)
Dữ liệu được tổ chức chuẩn hóa trong Cơ sở dữ liệu quan hệ với các bảng chính:
*   `STATIONS`: Quản lý danh mục 12 trạm đo khí tượng vật lý.
*   `AIR_QUALITY_READINGS`: Lưu trữ dữ liệu quan trắc thời gian thực (PM2.5, PM10, SO2, NO2, CO, O3, TEMP, PRES, DEWP, RAIN, wd, WSPM).
*   `DAILY_STATION_SUMMARY`: Tóm tắt chỉ số trung bình và nhãn mùa (`season`) phục vụ báo cáo.
*   `USERS` & `PARENT_CHILD_LINKS`: Quản lý thông tin người dùng, vị trí định vị trạm gần nhất và liên kết giám sát bảo vệ trẻ em (trạm trường học).
*   `HEALTH_CONDITIONS` & `USER_HEALTH_CONDITIONS`: Bản đồ bệnh lý người dùng phục vụ cấu trúc ngưỡng kích hoạt cảnh báo động.
*   `AQI_FORECASTS` & `ML_MODELS`: Lưu vết dự báo từ mô hình ML và thông tin định danh phiên bản thuật toán.
*   `ALERTS_SENT`: Nhật ký lịch sử gửi tin nhắn/thông báo qua App/SMS.

---

## 🤖 Mô Hình Học Máy (Machine Learning Classifier)

Mô hình học máy thực hiện phân lớp chất lượng không khí đa tầng thành **6 phân lớp AQI** chuẩn hóa.

### Thông số huấn luyện:
*   **Tổng số mẫu xử lý (Rows used):** 412,028 bản ghi
*   **Tập huấn luyện (Training Set):** 329,622 bản ghi (80%)
*   **Tập kiểm thử (Testing Set):** 82,406 bản ghi (20%)
*   **Độ chính xác tổng thể (Overall Accuracy):** **76.70%**

### Hiệu năng phân loại chi tiết (Classification Report):
| Phân lớp AQI (CLASS_NAMES) | Precision (Độ chính xác) | Recall (Độ thu hồi) | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Good** (Tốt) | 83.49% | 76.77% | 79.99% | 13,084 |
| **Moderate** (Trung bình) | 70.12% | 75.12% | 72.54% | 18,704 |
| **Unhealthy for Sensitive Groups** (Kém) | 62.75% | 48.57% | 54.76% | 10,961 |
| **Unhealthy** (Xấu) | 82.21% | 87.42% | 84.73% | 27,961 |
| **Very Unhealthy** (Rất xấu) | 78.88% | 72.23% | 75.41% | 7,995 |
| **Hazardous** (Nguy hại) | 74.35% | **96.41%** | 83.95% | 3,701 |

> **Nhận xét chuyên môn:** Mô hình đạt độ thu hồi (Recall) cực kỳ cao đối với mức **Hazardous (96.41%)**. Điều này đảm bảo hệ thống hầu như **không bỏ sót bất kỳ đợt ô nhiễm cực đoan nguy hại nào**, giúp tối ưu hóa an toàn tuyệt đối cho người dân.

---

## 📡 Đặc Tả RESTful API Endpoints

Hệ thống cung cấp bộ RESTful API chuẩn hóa dưới phiên bản `/api/v1/` phục vụ tích hợp giữa Frontend và Backend.

### 1. Dành cho Cán bộ Môi trường (Sở TN&MT)
*   `GET /api/v1/stations` - Lấy thông tin danh sách các trạm quan trắc.
*   `GET /api/v1/monitoring-data` - Truy xuất dữ liệu thô (cho phép lọc theo trạm và khoảng thời gian/mùa để phân tích xu hướng 2 năm).
*   `GET /api/v1/analytics/heatmap` - Trả về ma trận nồng độ chất ô nhiễm theo tháng/trạm để vẽ Heatmap.
*   `GET /api/v1/analytics/seasonal-comparison` - So sánh chất lượng không khí giữa 4 mùa, tự động tìm mùa ô nhiễm nhất.
*   `GET /api/v1/analytics/prominent-pollutants` - Xếp hạng các chất gây ô nhiễm chính trong mùa được chọn kèm ghi chú khuyến nghị.
*   `GET /api/v1/analytics/wind-rose` - Phân tích tương quan hướng gió và nồng độ bụi mịn PM2.5 (vẽ biểu đồ Wind Rose).
*   `POST /api/v1/data-cleaning/impute` - Kích hoạt quy trình làm sạch dữ liệu (Nội suy tuyến tính tự động nếu khoảng trống $\le$ 3 giờ; Đánh dấu duyệt thủ công nếu > 3 giờ để tránh sai số).
*   `GET /api/v1/reports/aqi/export` - Kết xuất báo cáo định kỳ dạng PDF hoặc Excel.

### 2. Dành cho Ứng dụng Người dân
*   `GET /api/v1/aqi/current` - Xác định vị trí GPS hiện tại, tự động ánh xạ trạm gần nhất để hiển thị AQI thực tế và phân nhóm chất lượng.
*   `PUT /api/v1/users/profile` - Khai báo hồ sơ sức khỏe người dùng (Trẻ em, người già, hen suyễn, tim mạch) để tự động kích hoạt chế độ Cảnh báo sớm.

### 3. Tích hợp Mô hình ML (Đường ống dữ liệu nội bộ)
*   `POST /api/v1/internal/ml-predictions` - Endpoint bảo mật để ML Service đẩy (Push) kết quả dự báo chất lượng không khí 24-48 giờ tới về Database.
*   `POST /api/v1/internal/ml-models/register` - Đăng ký siêu dữ liệu huấn luyện (Model Metadata) bao gồm các chỉ số MAE, RMSE và Classification Report vào DB để quản lý phiên bản (Model Versioning).

---

## 🧪 Kiểm Thử Phát Triển Hành Vi (Gherkin BDD)

Hệ thống áp dụng phương pháp kiểm thử **BDD (Behavior-Driven Development)** để đảm bảo tính khớp nối nghiệp vụ giữa các bộ phận phát triển.

### Kịch bản 1: Cảnh báo tự động AQI nguy hại (Dành cho toàn dân)
```gherkin
Feature: Cảnh báo tự động AQI vượt ngưỡng nguy hại cho người dân thường

  Scenario: Tự động gửi thông báo qua App/SMS khi AQI dự báo vượt ngưỡng 150
    Given Mô hình dự báo sinh ra kết quả cho khu vực của người dùng có AQI = 158
    And Người dùng chưa khai báo thuộc nhóm nhạy cảm trong hồ sơ
    When Hệ thống Backend nhận dữ liệu dự báo từ mô hình ML và phát hiện ngưỡng vượt mức 150
    Then Hệ thống tự động gửi thông báo cảnh báo qua App và SMS đến người dùng trong vòng 5 phút
```

### Kịch bản 2: Cảnh báo sớm kèm khuyến nghị thông minh (Dành cho nhóm nhạy cảm)
```gherkin
Feature: Cảnh báo sớm cho người thuộc nhóm nhạy cảm về hô hấp

  Scenario: Nhận cảnh báo sớm ở ngưỡng AQI thấp hơn kèm khuyến nghị hành động cụ thể
    Given Người dùng đã khai báo bệnh lý "Hen suyễn" trong hồ sơ sức khỏe
    And Mô hình dự báo sinh ra kết quả AQI dự kiến là 115 (Mức: "Unhealthy for Sensitive Groups")
    When Hệ thống kiểm tra dữ liệu dự báo và đối chiếu với hồ sơ sức khỏe người dùng
    Then Hệ thống gửi cảnh báo sớm về máy người dùng thay vì đợi đạt ngưỡng 150
    And Nội dung tin nhắn gửi đi phải đính kèm khuyến nghị: "Hạn chế ra ngoài, đeo khẩu trang và đóng cửa sổ"
```

