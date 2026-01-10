package com.vcm.crm.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reminders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reminder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;  // ⚠️ Cambiado de Long a Integer
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private LocalDateTime dueAt;
    
    private LocalDateTime nextRunAt;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepeatEvery repeatEvery = RepeatEvery.NONE;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Channel channel = Channel.INAPP;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntityType entityType = EntityType.OTHER;
    
    private Long entityId;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (nextRunAt == null) {
            nextRunAt = dueAt;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum RepeatEvery {
        NONE, DAILY, WEEKLY, MONTHLY
    }
    
    public enum Channel {
        INAPP, EMAIL, WHATSAPP
    }
    
    public enum EntityType {
        LEAD, CLIENT, SERVICE, USER, OTHER
    }
}