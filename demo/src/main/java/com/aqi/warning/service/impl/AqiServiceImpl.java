package com.aqi.warning.service.impl;

import com.aqi.warning.dto.AqiHistoryResponse;
import com.aqi.warning.entity.Station;
import com.aqi.warning.repository.StationRepository;
import com.aqi.warning.service.AqiService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AqiServiceImpl implements AqiService {

    private final StationRepository stationRepository;

    public AqiServiceImpl(StationRepository stationRepository) {
        this.stationRepository = stationRepository;
    }

    // Lưu cache dự báo nạp từ model ML trong bộ nhớ backend
    public static final Map<Long, List<Map<String, Object>>> FORECAST_CACHE = new HashMap<>();

    @Override
    @Transactional(readOnly = true)
    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentAqi(Long stationId) {
        Station station = stationRepository.findById(stationId)
                .orElse(stationRepository.findAll().stream().findFirst().orElse(null));

        Map<String, Object> result = new LinkedHashMap<>();
        if (station == null) {
            result.put("stationId", stationId);
            result.put("aqi", 45.0);
            result.put("category", "Tốt");
            return result;
        }

        // Lấy bản ghi dự báo gần nhất nếu có hoặc giá trị chuẩn
        List<Map<String, Object>> forecasts = FORECAST_CACHE.get(station.getStationId());
        double currentAqi = 48.0;
        if (forecasts != null && !forecasts.isEmpty()) {
            Object val = forecasts.get(0).get("predictedAqi");
            if (val instanceof Number) {
                currentAqi = ((Number) val).doubleValue();
            }
        }

        result.put("stationId", station.getStationId());
        result.put("stationName", station.getName());
        result.put("district", station.getDistrict());
        result.put("latitude", station.getLatitude());
        result.put("longitude", station.getLongitude());
        result.put("aqi", currentAqi);
        result.put("category", determineCategory((float) currentAqi));
        result.put("measuredAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getForecast48h(Long stationId) {
        List<Map<String, Object>> cached = FORECAST_CACHE.get(stationId);
        if (cached != null && !cached.isEmpty()) {
            return cached;
        }

        // Tạo dữ liệu dự báo 48h mẫu nếu chưa nạp file
        List<Map<String, Object>> fallback = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int h = 1; h <= 48; h++) {
            Map<String, Object> item = new LinkedHashMap<>();
            double aqi = 50.0 + Math.sin(h / 3.0) * 20.0 + Math.cos(h / 5.0) * 15.0;
            item.put("stationId", stationId);
            item.put("forecastHour", h);
            item.put("forecastDay", h <= 24 ? 1 : 2);
            item.put("targetTime", now.plusHours(h).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            item.put("predictedAqi", Math.round(aqi * 10.0) / 10.0);
            item.put("predictedClass", determineCategory((float) aqi));
            fallback.add(item);
        }
        return fallback;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTravelPlan(Long stationId, String persona) {
        Map<String, Object> plan = new LinkedHashMap<>();
        int[] diurnalAqi = {45, 42, 40, 38, 42, 55, 75, 95, 110, 85, 65, 58, 55, 60, 68, 75, 98, 115, 120, 95, 80, 65, 55, 48};

        List<Map<String, Object>> hourly = new ArrayList<>();
        int minHour = 3, maxHour = 18;
        for (int h = 0; h < 24; h++) {
            Map<String, Object> hourMap = new LinkedHashMap<>();
            hourMap.put("hour", h);
            hourMap.put("aqi", diurnalAqi[h]);
            hourMap.put("isSafe", diurnalAqi[h] <= (("children".equals(persona) || "elderly".equals(persona) || "asthma".equals(persona)) ? 80 : 100));
            hourly.add(hourMap);
        }

        plan.put("stationId", stationId);
        plan.put("persona", persona != null ? persona : "general");
        plan.put("recommendedSafeWindow", "06:00 - 08:30 và sau 19:30");
        plan.put("highPollutionWindow", "16:30 - 19:00 (Giờ tan tầm đông đúc)");
        plan.put("hourlyForecast", hourly);

        return plan;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AqiHistoryResponse> getAqiHistory(Long stationId, LocalDateTime fromDate, LocalDateTime toDate) {
        Station station = stationRepository.findById(stationId)
                .orElse(null);

        List<AqiHistoryResponse> historyList = new ArrayList<>();
        if (station != null) {
            historyList.add(AqiHistoryResponse.builder()
                    .stationId(station.getStationId())
                    .stationName(station.getName())
                    .aqi(45.0f)
                    .category("Tốt")
                    .timestamp(fromDate != null ? fromDate : LocalDateTime.now().minusDays(1))
                    .build());
        }
        return historyList;
    }

    private String determineCategory(Float aqi) {
        if (aqi == null) return "Chưa có dữ liệu";
        if (aqi <= 50) return "Tốt";
        if (aqi <= 100) return "Trung bình";
        if (aqi <= 150) return "Kém";
        if (aqi <= 200) return "Xấu";
        if (aqi <= 300) return "Rất xấu";
        return "Nguy hại";
    }
}