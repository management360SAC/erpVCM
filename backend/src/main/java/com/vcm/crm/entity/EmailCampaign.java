// src/main/java/com/vcm/crm/entity/EmailCampaign.java
package com.vcm.crm.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "email_campaign")
public class EmailCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false)
    private Integer orgId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 200)
    private String subject;

    @Lob
    @Column(name = "body_html", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String bodyHtml;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmailCampaignStatus status;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "total_recipients", nullable = false)
    private Integer totalRecipients = 0;

    @Column(name = "sent_count", nullable = false)
    private Integer sentCount = 0;

    @Column(name = "opens_count", nullable = false)
    private Integer opensCount = 0;

    @Column(name = "clicks_count", nullable = false)
    private Integer clicksCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EmailCampaignRecipient> recipients = new ArrayList<>();

    // 💡 NUEVOS CAMPOS PARA LA IMAGEN DE CABECERA
    @Lob
    @Column(name = "header_image", columnDefinition = "LONGBLOB")
    private byte[] headerImageBytes;

    @Column(name = "header_image_type", length = 100)
    private String headerImageContentType;

    // ========= getters & setters =========

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getOrgId() { return orgId; }
    public void setOrgId(Integer orgId) { this.orgId = orgId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBodyHtml() { return bodyHtml; }
    public void setBodyHtml(String bodyHtml) { this.bodyHtml = bodyHtml; }

    public EmailCampaignStatus getStatus() { return status; }
    public void setStatus(EmailCampaignStatus status) { this.status = status; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public Integer getTotalRecipients() { return totalRecipients; }
    public void setTotalRecipients(Integer totalRecipients) { this.totalRecipients = totalRecipients; }

    public Integer getSentCount() { return sentCount; }
    public void setSentCount(Integer sentCount) { this.sentCount = sentCount; }

    public Integer getOpensCount() { return opensCount; }
    public void setOpensCount(Integer opensCount) { this.opensCount = opensCount; }

    public Integer getClicksCount() { return clicksCount; }
    public void setClicksCount(Integer clicksCount) { this.clicksCount = clicksCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<EmailCampaignRecipient> getRecipients() { return recipients; }
    public void setRecipients(List<EmailCampaignRecipient> recipients) { this.recipients = recipients; }

    public void addRecipient(EmailCampaignRecipient r) {
        recipients.add(r);
        r.setCampaign(this);
    }

    // 💡 NUEVOS GETTERS/SETTERS PARA LA IMAGEN

    public byte[] getHeaderImageBytes() {
        return headerImageBytes;
    }

    public void setHeaderImageBytes(byte[] headerImageBytes) {
        this.headerImageBytes = headerImageBytes;
    }

    public String getHeaderImageContentType() {
        return headerImageContentType;
    }

    public void setHeaderImageContentType(String headerImageContentType) {
        this.headerImageContentType = headerImageContentType;
    }
}
