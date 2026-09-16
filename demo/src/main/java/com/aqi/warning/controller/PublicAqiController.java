package com.aqi.warning.controller;

import com.aqi.warning.dto.AqiHistoryResponse;
import com.aqi.warning.entity.Station;
import com.aqi.warning.service.AqiService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class PublicAqiController {

    private final AqiService aqiService;

    public PublicAqiController(AqiService aqiService) {
        this.aqiService = aqiService;
    }

    /**
     * API 1: Lấy danh sách 12 trạm quan trắc (US01)
     * GET /api/v1/stations
     */
    @GetMapping({"/api/v1/stations", "/api/v2/public/stations"})
    public ResponseEntity<Map<String, Object>> getStations() {
        List<Station> stations = aqiService.getAllStations();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "total", stations.size(),
                "data", stations
        ));
    }

    /**
     * API 6: Lấy chất lượng không khí hiện tại của trạm (US10)
     * GET /api/v1/aqi/current?stationId=1
     */
    @GetMapping({"/api/v1/aqi/current", "/api/v2/public/aqi/current"})
    public ResponseEntity<Map<String, Object>> getCurrentAqi(
            @RequestParam(required = false, defaultValue = "1") Long stationId) {
        Map<String, Object> current = aqiService.getCurrentAqi(stationId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", current
        ));
    }

    /**
     * API: Lấy dữ liệu dự báo 48 giờ (2 ngày tới) từ mô hình ML (US08, US09)
     * GET /api/v1/aqi/forecast?stationId=1
     */
    @GetMapping({"/api/v1/aqi/forecast", "/api/v1/aqi/forecast-2days", "/api/v2/public/aqi/forecast"})
    public ResponseEntity<Map<String, Object>> getForecast48h(
            @RequestParam(required = false, defaultValue = "1") Long stationId) {
        List<Map<String, Object>> forecasts = aqiService.getForecast48h(stationId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "stationId", stationId,
                "forecastHorizonHours", 48,
                "totalRecords", forecasts.size(),
                "data", forecasts
        ));
    }

    /**
     * API: Lập kế hoạch di chuyển theo giờ cho nhóm nhạy cảm
     * GET /api/v1/advisory/travel-plan?stationId=1&persona=children
     */
    @GetMapping({"/api/v1/advisory/travel-plan", "/api/v2/public/travel-plan"})
    public ResponseEntity<Map<String, Object>> getTravelPlan(
            @RequestParam(required = false, defaultValue = "1") Long stationId,
            @RequestParam(required = false, defaultValue = "general") String persona) {
        Map<String, Object> plan = aqiService.getTravelPlan(stationId, persona);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", plan
        ));
    }

    /**
     * API 10: Xem lịch sử AQI theo trạm và khoảng thời gian (US10)
     * GET /api/v2/public/aqi/history?stationId=1&fromDate=2026-09-01T00:00:00&toDate=2026-09-10T23:59:59
     */
    @GetMapping({"/api/v1/aqi/history", "/api/v2/public/aqi/history"})
    public ResponseEntity<List<AqiHistoryResponse>> getAqiHistory(
            @RequestParam Long stationId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {

        List<AqiHistoryResponse> history = aqiService.getAqiHistory(stationId, fromDate, toDate);
        return ResponseEntity.ok(history);
    }
}