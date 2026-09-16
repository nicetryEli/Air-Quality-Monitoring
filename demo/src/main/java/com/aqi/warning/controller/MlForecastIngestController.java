package com.aqi.warning.controller;

import com.aqi.warning.dto.ForecastIngestRequest;
import com.aqi.warning.dto.ForecastIngestResponse;
import com.aqi.warning.service.ForecastService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@CrossOrigin(origins = "*")
public class MlForecastIngestController {

    private final ForecastService forecastService;

    public MlForecastIngestController(ForecastService forecastService) {
        this.forecastService = forecastService;
    }

    @PostMapping({"/api/v1/internal/ml-predictions", "/api/v2/internal/forecasts/ingest"})
    public ResponseEntity<ForecastIngestResponse> ingestForecastData(
            @RequestHeader(value = "X-ML-API-KEY", required = false) String apiKey, // Bảo mật giữa ML service & Backend
            @Valid @RequestBody ForecastIngestRequest request) {

        ForecastIngestResponse response = forecastService.processAndSaveForecasts(request);
        return ResponseEntity.ok(response);
    }
}