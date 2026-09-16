package com.aqi.warning.dto;

import java.time.LocalDateTime;

public class AqiHistoryResponse {
    private Long stationId;
    private String stationName;
    private LocalDateTime timestamp;
    private Float aqi;
    private String category;
    private Float pm25;
    private Float pm10;

    public AqiHistoryResponse() {}

    public AqiHistoryResponse(Long stationId, String stationName, LocalDateTime timestamp, Float aqi, String category, Float pm25, Float pm10) {
        this.stationId = stationId;
        this.stationName = stationName;
        this.timestamp = timestamp;
        this.aqi = aqi;
        this.category = category;
        this.pm25 = pm25;
        this.pm10 = pm10;
    }

    public static AqiHistoryResponseBuilder builder() {
        return new AqiHistoryResponseBuilder();
    }

    public static class AqiHistoryResponseBuilder {
        private Long stationId;
        private String stationName;
        private LocalDateTime timestamp;
        private Float aqi;
        private String category;
        private Float pm25;
        private Float pm10;

        public AqiHistoryResponseBuilder stationId(Long stationId) { this.stationId = stationId; return this; }
        public AqiHistoryResponseBuilder stationName(String stationName) { this.stationName = stationName; return this; }
        public AqiHistoryResponseBuilder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }
        public AqiHistoryResponseBuilder aqi(Float aqi) { this.aqi = aqi; return this; }
        public AqiHistoryResponseBuilder category(String category) { this.category = category; return this; }
        public AqiHistoryResponseBuilder pm25(Float pm25) { this.pm25 = pm25; return this; }
        public AqiHistoryResponseBuilder pm10(Float pm10) { this.pm10 = pm10; return this; }

        public AqiHistoryResponse build() {
            return new AqiHistoryResponse(stationId, stationName, timestamp, aqi, category, pm25, pm10);
        }
    }

    public Long getStationId() { return stationId; }
    public void setStationId(Long stationId) { this.stationId = stationId; }

    public String getStationName() { return stationName; }
    public void setStationName(String stationName) { this.stationName = stationName; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public Float getAqi() { return aqi; }
    public void setAqi(Float aqi) { this.aqi = aqi; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Float getPm25() { return pm25; }
    public void setPm25(Float pm25) { this.pm25 = pm25; }

    public Float getPm10() { return pm10; }
    public void setPm10(Float pm10) { this.pm10 = pm10; }
}