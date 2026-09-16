package com.aqi.warning.service;

import com.aqi.warning.dto.ForecastIngestRequest;
import com.aqi.warning.dto.ForecastIngestResponse;

public interface ForecastService {

    /**
     * Xử lý nạp dữ liệu dự báo từ mô hình Machine Learning và tự động kích hoạt Banner Cảnh báo công khai (US08, US09)
     */
    ForecastIngestResponse processAndSaveForecasts(ForecastIngestRequest request);
}