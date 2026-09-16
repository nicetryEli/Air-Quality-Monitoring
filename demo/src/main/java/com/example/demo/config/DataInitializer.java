package com.example.demo.config;

import com.aqi.warning.entity.Station;
import com.aqi.warning.repository.StationRepository;
import com.aqi.warning.service.impl.AqiServiceImpl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final StationRepository stationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DataInitializer(StationRepository stationRepository) {
        this.stationRepository = stationRepository;
    }

    @Override
    public void run(String... args) {
        initStations();
        loadForecastCache();
    }

    private void initStations() {
        if (stationRepository.count() > 0) {
            log.info("Cơ sở dữ liệu đã có trạm quan trắc.");
            return;
        }

        log.info("Khởi tạo danh sách 12 trạm quan trắc không khí mẫu...");
        List<Station> stations = List.of(
                Station.builder().name("Aotizhongxin").district("Triều Dương").latitude(39.982).longitude(116.397).status("ACTIVE").build(),
                Station.builder().name("Changping").district("Xương Bình").latitude(40.218).longitude(116.230).status("ACTIVE").build(),
                Station.builder().name("Dingling").district("Định Lăng").latitude(40.292).longitude(116.220).status("ACTIVE").build(),
                Station.builder().name("Dongsi").district("Đông Thành").latitude(39.929).longitude(116.417).status("ACTIVE").build(),
                Station.builder().name("Guanyuan").district("Tây Thành").latitude(39.929).longitude(116.339).status("ACTIVE").build(),
                Station.builder().name("Gucheng").district("Thạch Cảnh Sơn").latitude(39.914).longitude(116.184).status("ACTIVE").build(),
                Station.builder().name("Huairou").district("Hoài Nhu").latitude(40.328).longitude(116.628).status("ACTIVE").build(),
                Station.builder().name("Nongzhanguan").district("Triều Dương").latitude(39.937).longitude(116.461).status("ACTIVE").build(),
                Station.builder().name("Shunyi").district("Thuận Nghĩa").latitude(40.127).longitude(116.655).status("ACTIVE").build(),
                Station.builder().name("Tiantan").district("Đông Thành").latitude(39.886).longitude(116.407).status("ACTIVE").build(),
                Station.builder().name("Wanliu").district("Hải Điến").latitude(39.987).longitude(116.287).status("ACTIVE").build(),
                Station.builder().name("Wanshouxigong").district("Tây Thành").latitude(39.878).longitude(116.352).status("ACTIVE").build()
        );

        stationRepository.saveAll(stations);
        log.info("Đã lưu {} trạm quan trắc vào cơ sở dữ liệu.", stations.size());
    }

    private void loadForecastCache() {
        try {
            Path forecastPath = Paths.get("..", "dataset", "forecast_48h.json");
            File file = forecastPath.toFile();
            if (!file.exists()) {
                forecastPath = Paths.get("dataset", "forecast_48h.json");
                file = forecastPath.toFile();
            }

            if (file.exists()) {
                JsonNode root = objectMapper.readTree(file);
                JsonNode forecasts = root.get("forecasts");
                if (forecasts != null && forecasts.isArray()) {
                    for (JsonNode f : forecasts) {
                        Long stId = f.get("station_id").asLong();
                        AqiServiceImpl.FORECAST_CACHE.computeIfAbsent(stId, k -> new ArrayList<>());

                        Map<String, Object> map = new LinkedHashMap<>();
                        map.put("stationId", stId);
                        map.put("stationName", f.path("station_name").asText());
                        map.put("forecastHour", f.path("forecast_hour").asInt());
                        map.put("forecastDay", f.path("forecast_day").asInt());
                        map.put("targetTime", f.path("target_time").asText());
                        map.put("predictedAqi", f.path("predicted_aqi").asDouble());
                        map.put("predictedClass", f.path("predicted_class").asText());
                        map.put("labelVi", f.path("label_vi").asText());
                        map.put("actionGeneral", f.path("action_general").asText());
                        map.put("actionSensitive", f.path("action_sensitive").asText());

                        AqiServiceImpl.FORECAST_CACHE.get(stId).add(map);
                    }
                    log.info("Đã nạp thành công {} bản ghi dự báo 48h từ file {} vào bộ nhớ Backend.", forecasts.size(), file.getName());
                }
            }
        } catch (Exception e) {
            log.warn("Không thể nạp file forecast_48h.json lúc khởi động (sẽ dùng cơ chế fallback): {}", e.getMessage());
        }
    }
}
