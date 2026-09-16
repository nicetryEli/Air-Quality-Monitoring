package com.aqi.warning.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ml_models")
public class MlModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "model_id")
    private Long modelId;

    @Column(nullable = false, length = 50)
    private String version;

    @Column(name = "trained_at")
    private LocalDateTime trainedAt;

    private Double accuracy;
    private Double mae;
    private Double rmse;

    @Column(length = 20)
    private String status;

    public MlModel() {}

    public MlModel(Long modelId, String version, LocalDateTime trainedAt, Double accuracy, Double mae, Double rmse, String status) {
        this.modelId = modelId;
        this.version = version;
        this.trainedAt = trainedAt;
        this.accuracy = accuracy;
        this.mae = mae;
        this.rmse = rmse;
        this.status = status;
    }

    public static MlModelBuilder builder() {
        return new MlModelBuilder();
    }

    public static class MlModelBuilder {
        private Long modelId;
        private String version;
        private LocalDateTime trainedAt;
        private Double accuracy;
        private Double mae;
        private Double rmse;
        private String status;

        public MlModelBuilder modelId(Long modelId) { this.modelId = modelId; return this; }
        public MlModelBuilder version(String version) { this.version = version; return this; }
        public MlModelBuilder trainedAt(LocalDateTime trainedAt) { this.trainedAt = trainedAt; return this; }
        public MlModelBuilder accuracy(Double accuracy) { this.accuracy = accuracy; return this; }
        public MlModelBuilder mae(Double mae) { this.mae = mae; return this; }
        public MlModelBuilder rmse(Double rmse) { this.rmse = rmse; return this; }
        public MlModelBuilder status(String status) { this.status = status; return this; }

        public MlModel build() {
            return new MlModel(modelId, version, trainedAt, accuracy, mae, rmse, status);
        }
    }

    public Long getModelId() { return modelId; }
    public void setModelId(Long modelId) { this.modelId = modelId; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public LocalDateTime getTrainedAt() { return trainedAt; }
    public void setTrainedAt(LocalDateTime trainedAt) { this.trainedAt = trainedAt; }

    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }

    public Double getMae() { return mae; }
    public void setMae(Double mae) { this.mae = mae; }

    public Double getRmse() { return rmse; }
    public void setRmse(Double rmse) { this.rmse = rmse; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}