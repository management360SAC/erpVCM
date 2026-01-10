// src/main/java/com/vcm/crm/dto/EmailCampaignResponse.java
package com.vcm.crm.dto;

import com.vcm.crm.entity.EmailCampaignStatus;

import java.time.LocalDateTime;

public class EmailCampaignResponse {
    public Long id;
    public Integer orgId;
    public String name;
    public EmailCampaignStatus status;   // ← enum, no String
    public Integer sent;
    public Integer opens;
    public Integer clicks;
    public LocalDateTime scheduledAt;
}
