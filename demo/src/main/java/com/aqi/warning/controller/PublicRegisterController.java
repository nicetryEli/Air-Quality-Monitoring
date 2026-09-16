package com.aqi.warning.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v2/public/register")
@CrossOrigin(origins = "*")
public class PublicRegisterController {

    /**
     * API Nhận thông tin đăng ký của người dân
     * Theo Đặc tả v2.0 (US06, US07): Hệ thống hoạt động theo cơ chế PUBLIC.
     * Người dân không cần đăng ký tài khoản hay cung cấp thông tin cá nhân.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> registerCitizen() {
        return ResponseEntity.status(HttpStatus.OK).body(Map.of(
            "status", "PUBLIC_ACCESS_MODE",
            "message", "Hệ thống Cảnh báo AQI v2.0 phục vụ cộng đồng công khai. Người dân không cần đăng ký tài khoản hay khai báo thông tin cá nhân để tra cứu và nhận cảnh báo.",
            "accessPolicy", "Free & Anonymous"
        ));
    }
}