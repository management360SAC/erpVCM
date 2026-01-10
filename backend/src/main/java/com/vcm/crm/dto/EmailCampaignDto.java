package com.vcm.crm.dto;

import java.time.LocalDateTime;

public class EmailCampaignDto {

    public Long id;
    public Integer orgId;
    public String name;
    public String subject;
    public String status;
    public Integer totalRecipients;
    public Integer sentCount;
    public Integer opensCount;
    public Integer clicksCount;
    public LocalDateTime scheduledAt;
    public LocalDateTime sentAt;
    public LocalDateTime createdAt;
    public String headerImagePath; // opcional (puede ser null)
}
