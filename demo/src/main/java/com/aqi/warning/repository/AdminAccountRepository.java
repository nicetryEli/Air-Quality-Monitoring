package com.aqi.warning.repository;

import com.aqi.warning.entity.AdminAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AdminAccountRepository extends JpaRepository<AdminAccount, Long> {
    
    // Phục vụ API 6: Đăng nhập Admin
    Optional<AdminAccount> findByUsername(String username);
}