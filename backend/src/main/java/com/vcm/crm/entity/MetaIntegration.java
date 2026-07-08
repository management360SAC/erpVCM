package com.vcm.crm.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meta_integrations")
@Getter
@Setter
public class MetaIntegration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "org_id", nullable = false)
    private Integer orgId = 1;

    @Column(name = "page_id", length = 100)
    private String pageId;

    @Column(name = "page_name", length = 255)
    private String pageName;

    @Column(name = "page_access_token", columnDefinition = "TEXT")
    private String pageAccessToken;

    @Column(name = "verify_token", length = 255)
    private String verifyToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MetaStatus status = MetaStatus.DISCONNECTED;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum MetaStatus {
        CONNECTED, DISCONNECTED
    }
}
