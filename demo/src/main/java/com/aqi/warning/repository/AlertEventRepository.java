package com.aqi.warning.repository;

import com.aqi.warning.entity.AlertEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertEventRepository extends JpaRepository<AlertEvent, Long> {

    // Phục vụ API 5: Lấy danh sách Banner đang hiển thị (chưa bị đóng/resolved) của 1 trạm
    List<AlertEvent> findByStation_StationIdAndResolvedAtIsNull(Long stationId);

    // Phục vụ API 15: Thống kê tổng số cảnh báo trong khoảng thời gian cho Dashboard Admin
    @Query("SELECT COUNT(a) FROM AlertEvent a WHERE a.triggeredAt BETWEEN :startDate AND :endDate")
    long countAlertsBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Thống kê phân loại cảnh báo theo cấp độ
    @Query("SELECT a.alertLevel, COUNT(a) FROM AlertEvent a WHERE a.triggeredAt BETWEEN :startDate AND :endDate GROUP BY a.alertLevel")
    List<Object[]> countAlertsByLevelBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}