package com.aqi.warning.repository;

import com.aqi.warning.entity.MlModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MlModelRepository extends JpaRepository<MlModel, Long> {

    // Phục vụ API 16: Lấy mô hình ML đang hoạt động gần nhất cho Dashboard
    Optional<MlModel> findFirstByStatusOrderByTrainedAtDesc(String status);
}