package com.aqi.warning.service.impl;

import com.aqi.warning.dto.ForecastIngestRequest;
import com.aqi.warning.dto.ForecastIngestResponse;
import com.aqi.warning.entity.AlertEvent;
import com.aqi.warning.entity.Station;
import com.aqi.warning.repository.AlertEventRepository;
import com.aqi.warning.repository.StationRepository;
import com.aqi.warning.service.ForecastService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ForecastServiceImpl implements ForecastService {

    private final StationRepository stationRepository;
    private final AlertEventRepository alertEventRepository;

    public ForecastServiceImpl(StationRepository stationRepository, AlertEventRepository alertEventRepository) {
        this.stationRepository = stationRepository;
        this.alertEventRepository = alertEventRepository;
    }

    @Override
    @Transactional
    public ForecastIngestResponse processAndSaveForecasts(ForecastIngestRequest request) {
        Station station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new RuntimeException("Station not found: " + request.getStationId()));

        int alertsTriggered = 0;

        for (ForecastIngestRequest.ForecastDetail detail : request.getForecasts()) {
            Float aqi = detail.getPredictedAqi();

            // US09: Tự động kích hoạt Banner Cảnh báo công khai khi AQI vượt ngưỡng
            if (aqi > 100) {
                String level = aqi > 150 ? "Hazard" : "SensitiveGroup";
                String message = aqi > 150 
                        ? "Cảnh báo nguy hại: AQI dự báo đạt " + aqi + ". Mọi người hạn chế ra ngoài!" 
                        : "Cảnh báo nhóm nhạy cảm: AQI dự báo đạt " + aqi + ". Trẻ em và người già nên đeo khẩu trang.";

                AlertEvent alert = AlertEvent.builder()
                        .station(station)
                        .aqiValue(aqi)
                        .alertLevel(level)
                        .bannerMessage(message)
                        .triggeredAt(LocalDateTime.now())
                        .build();

                alertEventRepository.save(alert);
                alertsTriggered++;
            }
        }

        return ForecastIngestResponse.builder()
                .success(true)
                .message("Đã nạp thành công dữ liệu dự báo")
                .recordsIngested(request.getForecasts().size())
                .alertsTriggered(alertsTriggered)
                .build();
    }
}