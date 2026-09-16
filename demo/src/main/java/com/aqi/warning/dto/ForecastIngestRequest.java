package com.aqi.warning.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ForecastIngestRequest {
    private Long stationId;
    private String modelVersion;
    private List<ForecastDetail> forecasts;

    public ForecastIngestRequest() {}

    public ForecastIngestRequest(Long stationId, String modelVersion, List<ForecastDetail> forecasts) {
        this.stationId = stationId;
        this.modelVersion = modelVersion;
        this.forecasts = forecasts;
    }

    public static class ForecastDetail {
        private LocalDateTime forecastTime;
        private Float predictedAqi;
        private Float confidenceLower;
        private Float confidenceUpper;

        public ForecastDetail() {}

        public ForecastDetail(LocalDateTime forecastTime, Float predictedAqi, Float confidenceLower, Float confidenceUpper) {
            this.forecastTime = forecastTime;
            this.predictedAqi = predictedAqi;
            this.confidenceLower = confidenceLower;
            this.confidenceUpper = confidenceUpper;
        }

        public LocalDateTime getForecastTime() { return forecastTime; }
        public void setForecastTime(LocalDateTime forecastTime) { this.forecastTime = forecastTime; }

        public Float getPredictedAqi() { return predictedAqi; }
        public void setPredictedAqi(Float predictedAqi) { this.predictedAqi = predictedAqi; }

        public Float getConfidenceLower() { return confidenceLower; }
        public void setConfidenceLower(Float confidenceLower) { this.confidenceLower = confidenceLower; }

        public Float getConfidenceUpper() { return confidenceUpper; }
        public void setConfidenceUpper(Float confidenceUpper) { this.confidenceUpper = confidenceUpper; }
    }

    public Long getStationId() { return stationId; }
    public void setStationId(Long stationId) { this.stationId = stationId; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public List<ForecastDetail> getForecasts() { return forecasts; }
    public void setForecasts(List<ForecastDetail> forecasts) { this.forecasts = forecasts; }
}