package com.vcm.crm.dto;

import java.util.List;

public class CreateEmailCampaignRequest {
    private Integer orgId;
    private String name;
    private String subject;
    private String bodyHtml;
    private String scheduledAt; // ISO string "2025-11-19T09:00:00" o null
    private List<Integer> clientIds;

    // getters / setters
    public Integer getOrgId() { return orgId; }
    public void setOrgId(Integer orgId) { this.orgId = orgId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBodyHtml() { return bodyHtml; }
    public void setBodyHtml(String bodyHtml) { this.bodyHtml = bodyHtml; }

    public String getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }

    public List<Integer> getClientIds() { return clientIds; }
    public void setClientIds(List<Integer> clientIds) { this.clientIds = clientIds; }
}
