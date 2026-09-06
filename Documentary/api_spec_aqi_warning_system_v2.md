# ĐẶC TẢ RESTFUL API & QUY TRÌNH TÍCH HỢP MÔ HÌNH MACHINE LEARNING (V2)
## Hệ Thống Cảnh Báo Sớm AQI - Hợp tác cùng Sở Tài nguyên & Môi trường TP
*Gắn kết thiết kế Hệ cơ sở dữ liệu (ERD), Kịch bản nghiệp vụ (User Stories, Gherkin BDD) và Tài liệu kỹ thuật Mô hình ML*

---

## 1. MAPPING MÔ HÌNH ĐỐI CHIẾU THỐNG NHẤT (DATABASE & BUSINESS LOGIC)

Dựa trên dữ liệu quan trắc không khí 2 năm tại 12 trạm đo và thiết kế hệ thống cảnh báo sớm, chúng ta thiết lập hệ quy chiếu phân lớp AQI đồng bộ từ **Mô hình Cơ sở dữ liệu (ERD)** [76, 77, 78], **Mô hình Học máy (ML Classification)** [80, 81], cho đến **Giao diện Frontend (UI)** [68, 72].

### 1.1. Sáu Phân Lớp AQI Tiêu Chuẩn & Hành Động Khuyến Nghị
Mô hình Machine Learning sẽ phân loại chất lượng không khí dựa trên 6 phân lớp tiêu chuẩn đã được lưu trữ trong bảng `AQI_LEVELS` [78]:

| AQI Range | Class Name (ML Report) [80, 81] | Nhãn Tiếng Việt (Frontend) [68, 75] | Ngưỡng Kích Hoạt Cảnh Báo [75, 78] | Khuyến Nghị Hành Động (Bảng `AQI_LEVELS`) [79] |
| :--- | :--- | :--- | :--- | :--- |
| **0 - 50** | `Good` | Tốt | Bình thường | Khí quyển trong lành, an toàn cho tất cả mọi người. |
| **51 - 100** | `Moderate` | Trung bình | Bình thường | Chất lượng chấp nhận được, nhóm cực kỳ nhạy cảm cần đề phòng. |
| **101 - 150** | `Unhealthy for Sensitive Groups` | Kém | **Cảnh báo Sớm (Nhóm nhạy cảm)** [75] | Kích hoạt cảnh báo tự động cho tài khoản khai báo bệnh lý nền [75, 78]. **Hạn chế vận động mạnh ngoài trời.** |
| **151 - 200** | `Unhealthy` | Xấu | **Cảnh báo Toàn dân** [75] | Gửi thông báo đẩy qua App/SMS tới toàn thể người dân trong vòng 5 phút [75]. **Nên đeo khẩu trang chuyên dụng khi ra ngoài.** |
| **201 - 300** | `Very Unhealthy` | Rất xấu | **Cảnh báo khẩn cấp** [79] | Gửi thông báo kèm khuyến nghị khẩn cấp [79]. **Hạn chế ra ngoài, đặc biệt là người già và trẻ em.** |
| **> 300** | `Hazardous` | Nguy hại | **Cảnh báo nguy hiểm cấp độ cao** [79] | Gửi cảnh báo đỏ tức thì [79]. **Mọi người nên ở trong nhà và đóng kín các cửa sổ.** |

---

## 2. KIẾN TRÚC DATABASE (Dựa trên File `ERD.html.pdf`)
Để Frontend và Backend đồng bộ dữ liệu, dưới đây là cấu trúc chi tiết các bảng quan trọng từ biểu đồ thực thể mối quan hệ (ERD) [76, 77, 78, 79] phục vụ trực tiếp cho các RESTful API:

### 2.1. Nhóm bảng Quan trắc không khí & Dự báo
*   **`STATIONS`** (Quản lý 12 trạm đo) [76]:
    *   `station_id` (INT, PK) — Mã định danh trạm.
    *   `name` (VARCHAR) — Tên trạm (ví dụ: "Guanyuan", "Dongsi") [68].
    *   `latitude` (FLOAT) — Vĩ độ trạm.
    *   `longitude` (FLOAT) — Kinh độ trạm.
    *   `district` (VARCHAR) — Quận/Huyện đặt trạm.
    *   `status` (VARCHAR) — Trạng thái hoạt động ("Active", "Inactive").
*   **`AIR_QUALITY_READINGS`** (Lưu trữ dữ liệu thô hàng giờ) [76]:
    *   `reading_id` (BIGINT, PK)
    *   `station_id` (INT, FK -> STATIONS)
    *   `datetime` (DATETIME) — Thời gian đo.
    *   `pm25`, `pm10`, `so2`, `no2`, `co`, `o3` (FLOAT) — Nồng độ các chất ô nhiễm chính [76].
    *   `temp`, `pres`, `dewp`, `rain` (FLOAT) — Các chỉ số thời tiết hỗ trợ [76].
    *   `wd` (VARCHAR) — Hướng gió (ví dụ: "NNE", "NE") [70, 76].
    *   `wspm` (FLOAT) — Tốc độ gió [76].
*   **`DAILY_STATION_SUMMARY`** (Dữ liệu tổng hợp theo ngày phục vụ phân tích xu hướng và mùa) [76, 77]:
    *   `summary_id` (INT, PK)
    *   `station_id` (INT, FK -> STATIONS)
    *   `date` (DATE)
    *   `avg_pm25`, `avg_pm10`, `avg_so2`, `avg_no2`, `avg_co`, `avg_o3` (FLOAT)
    *   `aqi_avg` (FLOAT) — Chỉ số AQI trung bình ngày.
    *   `season` (VARCHAR) — Gán nhãn mùa ("Spring", "Summer", "Autumn", "Winter") [77].
*   **`AQI_FORECASTS`** (Kết quả dự báo từ Machine Learning) [77]:
    *   `forecast_id` (BIGINT, PK)
    *   `station_id` (INT, FK -> STATIONS)
    *   `model_id` (INT, FK -> ML_MODELS)
    *   `created_at` (DATETIME) — Thời gian sinh dự báo.
    *   `target_time` (DATETIME) — Thời điểm dự báo (mốc 1 giờ, 2 giờ... đến 48 giờ tiếp theo).
    *   `predicted_aqi` (FLOAT) — Chỉ số AQI dự kiến.

### 2.2. Nhóm bảng Người dùng & Sức khỏe cá nhân hóa
*   **`USERS`** (Quản lý người dân và nhóm đối tượng nhạy cảm) [77]:
    *   `user_id` (INT, PK)
    *   `full_name` (VARCHAR), `phone` (VARCHAR), `email` (VARCHAR), `password_hash` (VARCHAR)
    *   `latitude`, `longitude` (FLOAT) — Tọa độ hiện tại để định vị trạm gần nhất [75, 77].
    *   `nearest_station_id` (INT, FK -> STATIONS) — Trạm gần người dùng nhất [77].
    *   `notification_channel` (VARCHAR) — Kênh nhận cảnh báo ("App", "SMS", "Email") [75, 77].
*   **`HEALTH_CONDITIONS`** (Danh mục bệnh lý nền và ngưỡng cá nhân hóa) [78]:
    *   `condition_id` (INT, PK)
    *   `name` (VARCHAR) — Tên bệnh/tình trạng (Trẻ em, Người già, Hen suyễn, Tim mạch) [75].
    *   `default_threshold` (INT) — Ngưỡng AQI bắt đầu kích hoạt cảnh báo sớm (ví dụ: 100 đối với hen suyễn) [78].
*   **`USER_HEALTH_CONDITIONS`** (Mối quan hệ nhiều-nhiều giữa Users và Health Conditions) [77, 78]:
    *   `user_id` (INT, FK -> USERS)
    *   `condition_id` (INT, FK -> HEALTH_CONDITIONS)
*   **`PARENT_CHILD_LINKS`** (Quản lý cảnh báo cho phụ huynh) [78]:
    *   `link_id` (INT, PK)
    *   `parent_user_id` (INT, FK -> USERS) — Phụ huynh nhận cảnh báo [78].
    *   `child_user_id` (INT, FK -> USERS) — Con trẻ [78].
    *   `school_station_id` (INT, FK -> STATIONS) — Trạm đo gần trường học của con để giám sát chất lượng không khí [78].
*   **`ALERTS_SENT`** (Lịch sử gửi thông báo cảnh báo) [78]:
    *   `alert_id` (BIGINT, PK)
    *   `user_id` (INT, FK -> USERS)
    *   `station_id` (INT, FK -> STATIONS)
    *   `aqi_value` (FLOAT)
    *   `sent_at` (DATETIME)
    *   `channel` (VARCHAR) — SMS hoặc App [75, 78].
    *   `status` (VARCHAR) — Trạng thái gửi ("Success", "Failed").

---

## 3. THỐNG NHẤT CÁC ENDPOINT RESTFUL API (FRONTEND <-> BACKEND)

Các API được thiết kế chuẩn RESTful, sử dụng định dạng JSON, phân tách rõ ràng quyền truy cập giữa **Cán bộ Sở TN&MT** và **Người dân**.

### 3.1. Phân hệ Quản trị & Phân tích chuyên sâu (Cán bộ Sở TN&MT)

#### API 1: Lấy danh sách 12 trạm quan trắc (US01)
*   **Endpoint:** `GET /api/v1/stations`
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "station_id": 1,
          "name": "Guanyuan",
          "latitude": 21.0285,
          "longitude": 105.8542,
          "district": "Ba Đình",
          "status": "Active"
        }
      ]
    }
    ```

#### API 2: Trực quan hóa bản đồ nhiệt ô nhiễm (Heatmap) (US04) [69]
*   **Endpoint:** `GET /api/v1/analytics/heatmap`
*   **Query Parameters:**
    *   `pollutant` (string, required): "pm25", "pm10", "so2", "no2", "co", "o3" [68]
    *   `year` (int, required): 2015
*   **Response (200 OK):** Ma trận nồng độ trung bình tháng của các trạm để vẽ biểu đồ bản đồ nhiệt [69].
    ```json
    {
      "success": true,
      "pollutant": "pm25",
      "year": 2015,
      "heatmap_matrix": [
        { "month": 12, "station_id": 1, "station_name": "Guanyuan", "avg_value": 84.5 },
        { "month": 12, "station_id": 2, "station_name": "Dongsi", "avg_value": 92.1 }
      ]
    }
    ```

#### API 3: So sánh nồng độ ô nhiễm trung bình giữa 4 mùa (US05) [69]
*   **Endpoint:** `GET /api/v1/analytics/seasonal-comparison`
*   **Query Parameters:**
    *   `station_id` (int, required): 1
    *   `pollutant` (string, required): "pm25"
*   **Response (200 OK):** So sánh giữa 4 mùa và tự động làm nổi bật mùa ô nhiễm nặng nhất [69].
    ```json
    {
      "success": true,
      "station_id": 1,
      "pollutant": "pm25",
      "seasonal_data": {
        "Spring": 48.5,
        "Summer": 32.4,
        "Autumn": 52.1,
        "Winter": 115.8
      },
      "highest_pollution_season": "Winter"
    }
    ```

#### API 4: Xếp hạng chất ô nhiễm nổi bật theo mùa (US06) [69, 70]
*   **Endpoint:** `GET /api/v1/analytics/prominent-pollutants`
*   **Query Parameters:**
    *   `season` (string, required): "Winter"
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "season": "Winter",
      "ranking": [
        { "rank": 1, "pollutant": "pm25", "excess_rate": 1.58 },
        { "rank": 2, "pollutant": "pm10", "excess_rate": 1.12 }
      ],
      "caution_note": "Không kết luận chắc chắn về nguồn phát thải nếu thiếu dữ liệu giao thông/công nghiệp"
    }
    ```

#### API 5: Kích hoạt làm sạch và tự động nội suy dữ liệu (US08) [71]
*   **Endpoint:** `POST /api/v1/data-cleaning/impute`
*   **Request Body:**
    ```json
    {
      "station_id": 1,
      "apply_interpolation": true
    }
    ```
*   **Response (200 OK):** Khoảng trống dữ liệu thời tiết dưới 3 giờ liên tiếp sẽ được tự động nội suy tuyến tính; trên 3 giờ sẽ giữ nguyên để xử lý thủ công [71].
    ```json
    {
      "success": true,
      "station_id": 1,
      "summary": {
        "interpolated_records_count": 42,
        "marked_for_manual_review_count": 12,
        "details": "Nội suy tuyến tính thành công cho các khoảng trống <= 3h liên tiếp."
      }
    }
    ```

---

### 3.2. Phân hệ Ứng dụng di động (Dành cho Người dân & Nhóm nhạy cảm)

#### API 6: Lấy chất lượng không khí hiện tại theo GPS (US10)
*   **Endpoint:** `GET /api/v1/aqi/current`
*   **Query Parameters:**
    *   `latitude` (float, required): 21.0285
    *   `longitude` (float, required): 105.8542
*   **Response (200 OK):** Định vị trạm gần nhất và trả về AQI hiện thời dựa trên bảng `AQI_LEVELS` [77, 78].
    ```json
    {
      "success": true,
      "user_location": { "latitude": 21.0285, "longitude": 105.8542 },
      "nearest_station": { "station_id": 1, "name": "Guanyuan", "distance_km": 1.12 },
      "current_aqi": {
        "value": 115,
        "class_name": "Unhealthy for Sensitive Groups",
        "label": "Kém",
        "main_pollutant": "pm25"
      }
    }
    ```

#### API 7: Khai báo tình trạng bệnh lý cá nhân (US14) [75]
*   **Endpoint:** `PUT /api/v1/users/health-profile`
*   **Headers:** `Authorization: Bearer <user_token>`
*   **Request Body:**
    ```json
    {
      "conditions": ["asthma", "elderly"] 
    }
    ```
*   **Response (200 OK):** Đồng bộ cấu trúc hồ sơ sức khỏe và áp dụng ngưỡng cảnh báo sớm cá nhân hóa theo bảng bệnh lý `HEALTH_CONDITIONS` [78].
    ```json
    {
      "success": true,
      "message": "Cập nhật hồ sơ sức khỏe thành công.",
      "applied_alert_threshold": 100,
      "monitored_conditions": [
        { "name": "Hen suyễn", "threshold": 100 },
        { "name": "Người cao tuổi", "threshold": 100 }
      ]
    }
    ```

---

## 4. GIAO THỨC TÍCH HỢP & NHẬN DỰ BÁO TỪ MÔ HÌNH MACHINE LEARNING

Để hệ thống cảnh báo vận hành tự động theo thời gian thực, mô hình Machine Learning cần:
1. Đăng ký thông tin huấn luyện và chất lượng mô hình (đọc từ dữ liệu metadata ML nguồn).
2. Định kỳ đẩy (Push) dữ liệu dự báo 48 giờ tới của các trạm về Backend.

### 4.1. Đăng ký metadata và kiểm định chất lượng mô hình ML
Dưới đây là API dùng để lưu trữ vết huấn luyện của mô hình Học máy, đồng bộ thông số trực tiếp từ cấu trúc file kết quả huấn luyện thực tế trong tài liệu [80, 81, 82]:

*   **Endpoint:** `POST /api/v1/internal/ml-models/register`
*   **Headers:** `X-ML-Service-Token: <secure_token>`
*   **Request Body:** (Đọc trực tiếp từ tệp JSON của mô hình trong nguồn) [80, 81, 82]
    ```json
    {
      "version": "v3.2.1",
      "trained_at": "2026-09-05T00:00:00Z",
      "model_metrics": {
        "rows_used": 412028,
        "training_rows": 329622,
        "testing_rows": 82406,
        "test_fraction": 0.2,
        "training_end": "2016-05-12T21:00:00",
        "testing_start": "2016-05-12T21:00:00",
        "accuracy": 0.7670072567531491,
        "mae": 12.45,
        "rmse": 18.12
      },
      "classification_report": {
        "Good": {
          "precision": 0.8349264400299227,
          "recall": 0.7677315805564048,
          "f1-score": 0.7999203663149512,
          "support": 13084.0
        },
        "Moderate": {
          "precision": 0.7012176863958479,
          "recall": 0.7512296834901625,
          "f1-score": 0.7253626555159775,
          "support": 18704.0
        },
        "Unhealthy for Sensitive Groups": {
          "precision": 0.6275341819896275,
          "recall": 0.48572210564729495,
          "f1-score": 0.5475957829776292,
          "support": 10961.0
        },
        "Unhealthy": {
          "precision": 0.8220832072108432,
          "recall": 0.8741818962125818,
          "f1-score": 0.8473324782473047,
          "support": 27961.0
        },
        "Very Unhealthy": {
          "precision": 0.788826663024177,
          "recall": 0.7223264540337712,
          "f1-score": 0.7541133455210237,
          "support": 7995.0
        },
        "Hazardous": {
          "precision": 0.7434882267138987,
          "recall": 0.9640637665495811,
          "f1-score": 0.8395294117647059,
          "support": 3701.0
        }
      }
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "success": true,
      "model_id": 15,
      "status": "Ready",
      "message": "Đăng ký phiên bản mô hình thành công. Sẵn sàng nhận dự báo."
    }
    ```

### 4.2. API Đẩy dự báo hàng giờ từ ML sang Backend (ML -> Backend)
Mô hình Học máy sẽ chạy phân tích tự động hàng giờ và đẩy (POST) kết quả của 12 trạm về cho hệ thống xử lý trung tâm.

*   **Endpoint:** `POST /api/v1/internal/ml-predictions`
*   **Headers:** `X-ML-Service-Token: <secure_token>`
*   **Request Body:**
    ```json
    {
      "model_id": 15,
      "generated_at": "2026-09-06T00:00:00Z",
      "forecasts": [
        {
          "station_id": 1,
          "target_time": "2026-09-06T08:00:00Z",
          "predicted_aqi": 118.5,
          "predicted_class": "Unhealthy for Sensitive Groups"
        },
        {
          "station_id": 1,
          "target_time": "2026-09-06T15:00:00Z",
          "predicted_aqi": 162.0,
          "predicted_class": "Unhealthy"
        }
      ]
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "received_records": 2,
      "alerts_triggered_count": 1,
      "message": "Dữ liệu dự báo được ghi nhận. Kích hoạt luồng phân tích cảnh báo sớm thành công."
    }
    ```

---

## 5. QUY TRÌNH XỬ LÝ SỰ KIỆN CẢNH BÁO (ALERT TRIGGER PIPELINE)

Khi nhận dữ liệu dự báo từ mô hình Machine Learning, Backend sẽ chạy ngầm tiến trình kiểm tra tự động theo mô hình logic dưới đây:

```
          [ ML Service ] định kỳ đẩy dự báo về Backend
                              │
                              ▼
           Hệ thống lưu dự báo vào bảng `AQI_FORECASTS` [77]
                              │
                              ├─────────────────────────────────────────┐
                              ▼                                         ▼
                 Ngưỡng Toàn dân: AQI > 150                      Ngưỡng Nhóm nhạy cảm: AQI > 100
                (Class: Unhealthy/Hazardous...)             (Class: Unhealthy for Sensitive Groups...)
                              │                                         │
                              ▼                                         ▼
                 Truy vấn tất cả người dùng                     Truy vấn người dùng có bệnh lý nền
                 ở gần trạm bị ô nhiễm [75, 77]                hoặc phụ huynh có con đi học gần trạm [75, 78]
                              │                                         │
                              ▼                                         ▼
                   Gửi cảnh báo tức thời                             Gửi cảnh báo sớm cá nhân hóa
                  qua SMS/App trong vòng 5' [75]                    kèm khuyến nghị hành động tương ứng [75, 78]
```

---

## 6. KIỂM THỬ NGHIỆM THU TÍCH HỢP BDD (GHERKIN SYNTAX)

Các kịch bản dưới đây được sử dụng để kiểm thử tích hợp tự động cho luồng trao đổi dữ liệu từ ML về Backend và bắn cảnh báo sớm cho Frontend.

### Kịch bản 1: Cảnh báo thông thường khi chất lượng không khí vượt ngưỡng nguy hại (US12) [75]
```gherkin
Feature: Cảnh báo tự động khi AQI vượt ngưỡng nguy hại cho người dân thường

  Scenario: Tự động gửi thông báo qua App/SMS khi AQI dự báo vượt ngưỡng 150 (Unhealthy)
    Given Mô hình dự báo (Model ID: 15) sinh ra kết quả cho trạm đo số 1 (Guanyuan) có AQI = 162.0 (Class: "Unhealthy")
    And Người dân "Nguyễn Văn A" đang định vị ở gần trạm số 1 và hồ sơ không khai báo bệnh lý
    When Hệ thống Backend nhận dữ liệu dự báo từ ML Service thông qua endpoint POST /api/v1/internal/ml-predictions
    Then Hệ thống tự động ghi nhận bản ghi vào bảng ALERTS_SENT
    And Gửi thông báo đẩy (Push Notification) đến App của "Nguyễn Văn A" trong vòng 5 phút với nội dung: "AQI dự kiến đạt mức Xấu (162). Hãy đeo khẩu trang chuyên dụng khi ra đường."
```

### Kịch bản 2: Cảnh báo sớm cá nhân hóa cho nhóm người dùng nhạy cảm (US15, US16) [75]
```gherkin
Feature: Cảnh báo sớm cá nhân hóa dành cho nhóm đối tượng nhạy cảm về hô hấp

  Scenario: Nhận cảnh báo sớm ở ngưỡng AQI thấp hơn kèm khuyến nghị hành động của Sở Y tế
    Given Người dùng "Trần Thị B" đã khai báo tiền sử bệnh "Hen suyễn" trong hồ sơ sức khỏe (Bảng USER_HEALTH_CONDITIONS)
    And Mô hình dự báo đẩy kết quả AQI dự kiến tại trạm gần nhất của cô ấy là 118.5 (Class: "Unhealthy for Sensitive Groups")
    When Hệ thống chạy trình kiểm tra ngưỡng tự động sau khi nhận dữ liệu ML
    Then Hệ thống gửi cảnh báo sớm về máy của "Trần Thị B" (mặc dù AQI chưa đạt mức nguy hiểm cho toàn dân 150)
    And Nội dung tin nhắn gửi đi phải đính kèm khuyến nghị: "AQI dự báo đạt mức Kém (118.5). Khuyến nghị từ Sở Y tế: Nhóm nhạy cảm hãy hạn chế vận động mạnh ngoài trời."
