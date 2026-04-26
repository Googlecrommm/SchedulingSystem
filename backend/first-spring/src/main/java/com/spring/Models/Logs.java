package com.spring.Models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@Table(name = "logs")
public class Logs {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int logId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "userId")
    private Users user;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false, name = "logHeader")
    private String logHeader;

    @NotBlank
    @Column(nullable = false, name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(nullable = false, name = "createdAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Logs(){}

    public int getLogId() {
        return logId;
    }

    public void setLogId(int logId) {
        this.logId = logId;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public String getLogHeader() {
        return logHeader;
    }

    public void setLogHeader(String logHeader) {
        this.logHeader = logHeader;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
