package com.aqi.warning.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "stations")
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "station_id")
    private Long stationId;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 100)
    private String district;

    private Double latitude;

    private Double longitude;

    @Column(length = 20)
    private String status;

    public Station() {}

    public Station(Long stationId, String name, String district, Double latitude, Double longitude, String status) {
        this.stationId = stationId;
        this.name = name;
        this.district = district;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
    }

    public static StationBuilder builder() {
        return new StationBuilder();
    }

    public static class StationBuilder {
        private Long stationId;
        private String name;
        private String district;
        private Double latitude;
        private Double longitude;
        private String status;

        public StationBuilder stationId(Long stationId) { this.stationId = stationId; return this; }
        public StationBuilder name(String name) { this.name = name; return this; }
        public StationBuilder district(String district) { this.district = district; return this; }
        public StationBuilder latitude(Double latitude) { this.latitude = latitude; return this; }
        public StationBuilder longitude(Double longitude) { this.longitude = longitude; return this; }
        public StationBuilder status(String status) { this.status = status; return this; }

        public Station build() {
            return new Station(stationId, name, district, latitude, longitude, status);
        }
    }

    public Long getStationId() { return stationId; }
    public void setStationId(Long stationId) { this.stationId = stationId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}