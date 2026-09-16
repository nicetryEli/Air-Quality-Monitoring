package com.aqi.warning.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_accounts")
public class AdminAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "admin_id")
    private Long adminId;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 50)
    private String role;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public AdminAccount() {}

    public AdminAccount(Long adminId, String username, String passwordHash, String fullName, String role, LocalDateTime createdAt, LocalDateTime lastLoginAt) {
        this.adminId = adminId;
        this.username = username;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.role = role;
        this.createdAt = createdAt;
        this.lastLoginAt = lastLoginAt;
    }

    public static AdminAccountBuilder builder() {
        return new AdminAccountBuilder();
    }

    public static class AdminAccountBuilder {
        private Long adminId;
        private String username;
        private String passwordHash;
        private String fullName;
        private String role;
        private LocalDateTime createdAt;
        private LocalDateTime lastLoginAt;

        public AdminAccountBuilder adminId(Long adminId) { this.adminId = adminId; return this; }
        public AdminAccountBuilder username(String username) { this.username = username; return this; }
        public AdminAccountBuilder passwordHash(String passwordHash) { this.passwordHash = passwordHash; return this; }
        public AdminAccountBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public AdminAccountBuilder role(String role) { this.role = role; return this; }
        public AdminAccountBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public AdminAccountBuilder lastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; return this; }

        public AdminAccount build() {
            return new AdminAccount(adminId, username, passwordHash, fullName, role, createdAt, lastLoginAt);
        }
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getAdminId() { return adminId; }
    public void setAdminId(Long adminId) { this.adminId = adminId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}