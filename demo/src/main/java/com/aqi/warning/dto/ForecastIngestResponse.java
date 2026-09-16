package com.aqi.warning.dto;

public class ForecastIngestResponse {
    private boolean success;
    private String message;
    private int recordsIngested;
    private int alertsTriggered;

    public ForecastIngestResponse() {}

    public ForecastIngestResponse(boolean success, String message, int recordsIngested, int alertsTriggered) {
        this.success = success;
        this.message = message;
        this.recordsIngested = recordsIngested;
        this.alertsTriggered = alertsTriggered;
    }

    public static ForecastIngestResponseBuilder builder() {
        return new ForecastIngestResponseBuilder();
    }

    public static class ForecastIngestResponseBuilder {
        private boolean success;
        private String message;
        private int recordsIngested;
        private int alertsTriggered;

        public ForecastIngestResponseBuilder success(boolean success) { this.success = success; return this; }
        public ForecastIngestResponseBuilder message(String message) { this.message = message; return this; }
        public ForecastIngestResponseBuilder recordsIngested(int recordsIngested) { this.recordsIngested = recordsIngested; return this; }
        public ForecastIngestResponseBuilder alertsTriggered(int alertsTriggered) { this.alertsTriggered = alertsTriggered; return this; }

        public ForecastIngestResponse build() {
            return new ForecastIngestResponse(success, message, recordsIngested, alertsTriggered);
        }
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public int getRecordsIngested() { return recordsIngested; }
    public void setRecordsIngested(int recordsIngested) { this.recordsIngested = recordsIngested; }

    public int getAlertsTriggered() { return alertsTriggered; }
    public void setAlertsTriggered(int alertsTriggered) { this.alertsTriggered = alertsTriggered; }
}