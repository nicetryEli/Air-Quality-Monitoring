package com.aqi.warning.repository;

import com.aqi.warning.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StationRepository extends JpaRepository<Station, Long> {

    // Phục vụ API 1: Tìm kiếm trạm công khai theo tên trạm hoặc quận/huyện
    List<Station> findByNameContainingIgnoreCaseOrDistrictContainingIgnoreCase(String name, String district);

    // Tìm các trạm đang hoạt động
    List<Station> findByStatus(String status);
}