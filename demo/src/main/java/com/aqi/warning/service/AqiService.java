package com.aqi.warning.service;

import com.aqi.warning.dto.AqiHistoryResponse;
import com.aqi.warning.entity.Station;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface AqiService {

    /**
     * Lấy danh sách 12 trạm quan trắc không khí
     */
    List<Station> getAllStations();

    /**
     * Lấy chất lượng không khí hiện tại của một trạm
     */
    Map<String, Object> getCurrentAqi(Long stationId);

    /**
     * Lấy dữ liệu dự báo 48 giờ (2 ngày tới) cho một trạm từ mô hình ML
     */
    List<Map<String, Object>> getForecast48h(Long stationId);

    /**
     * Lập kế hoạch di chuyển theo giờ cho nhóm đối tượng nhạy cảm
     */
    Map<String, Object> getTravelPlan(Long stationId, String persona);

    /**
     * Lấy danh sách lịch sử AQI của một trạm trong khoảng thời gian (US10)
     */
    List<AqiHistoryResponse> getAqiHistory(Long stationId, LocalDateTime fromDate, LocalDateTime toDate);
}