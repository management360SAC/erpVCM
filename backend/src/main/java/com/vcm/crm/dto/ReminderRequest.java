package com.vcm.crm.dto;

import com.vcm.crm.entity.Reminder.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReminderRequest {
    private String title;
    private String description;
    private LocalDateTime dueAt;
    private RepeatEvery repeatEvery;
    private Channel channel;
    private EntityType entityType;
    private Long entityId;
    private Boolean isActive;
}