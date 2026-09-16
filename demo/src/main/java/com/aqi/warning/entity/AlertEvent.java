package com.aqi.warning.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alert_events")
public class AlertEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long alertId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private Station station;

    @Column(name = "forecast_id")
    private Long forecastId;

    @Column(name = "aqi_value", nullable = false)
    private Float aqiValue;

    @Column(name = "alert_level", nullable = false, length = 50)
    private String alertLevel;

    @Column(name = "banner_message", nullable = false)
    private String bannerMessage;

    @Column(name = "triggered_at", nullable = false)
    private LocalDateTime triggeredAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public AlertEvent() {}

    public AlertEvent(Long alertId, Station station, Long forecastId, Float aqiValue, String alertLevel, String bannerMessage, LocalDateTime triggeredAt, LocalDateTime resolvedAt) {
        this.alertId = alertId;
        this.station = station;
        this.forecastId = forecastId;
        this.aqiValue = aqiValue;
        this.alertLevel = alertLevel;
        this.bannerMessage = bannerMessage;
        this.triggeredAt = triggeredAt;
        this.resolvedAt = resolvedAt;
    }

    public static AlertEventBuilder builder() {
        return new AlertEventBuilder();
    }

    public static class AlertEventBuilder {
        private Long alertId;
        private Station station;
        private Long forecastId;
        private Float aqiValue;
        private String alertLevel;
        private String bannerMessage;
        private LocalDateTime triggeredAt;
        private LocalDateTime resolvedAt;

        public AlertEventBuilder alertId(Long alertId) { this.alertId = alertId; return this; }
        public AlertEventBuilder station(Station station) { this.station = station; return this; }
        public AlertEventBuilder forecastId(Long forecastId) { this.forecastId = forecastId; return this; }
        public AlertEventBuilder aqiValue(Float aqiValue) { this.aqiValue = aqiValue; return this; }
        public AlertEventBuilder alertLevel(String alertLevel) { this.alertLevel = alertLevel; return this; }
        public AlertEventBuilder bannerMessage(String bannerMessage) { this.bannerMessage = bannerMessage; return this; }
        public AlertEventBuilder triggeredAt(LocalDateTime triggeredAt) { this.triggeredAt = triggeredAt; return this; }
        public AlertEventBuilder resolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; return this; }

        public AlertEvent build() {
            return new AlertEvent(alertId, station, forecastId, aqiValue, alertLevel, bannerMessage, triggeredAt, resolvedAt);
        }
    }

    public Long getAlertId() { return alertId; }
    public void setAlertId(Long alertId) { this.alertId = alertId; }

    public Station getStation() { return station; }
    public void setStation(Station station) { this.station = station; }

    public Long getForecastId() { return forecastId; }
    public void setForecastId(Long forecastId) { this.forecastId = forecastId; }

    public Float getAqiValue() { return aqiValue; }
    public void setAqiValue(Float aqiValue) { this.aqiValue = aqiValue; }

    public String getAlertLevel() { return alertLevel; }
    public void setAlertLevel(String alertLevel) { this.alertLevel = alertLevel; }

    public String getBannerMessage() { return bannerMessage; }
    public void setBannerMessage(String bannerMessage) { this.bannerMessage = bannerMessage; }

    public LocalDateTime getTriggeredAt() { return triggeredAt; }
    public void setTriggeredAt(LocalDateTime triggeredAt) { this.triggeredAt = triggeredAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}