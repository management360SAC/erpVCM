package com.vcm.crm.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_campaign_recipient")
public class EmailCampaignRecipient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private EmailCampaign campaign;

    @Column(name = "client_id")
    private Integer clientId;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING / SENT / ERROR

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    // getters & setters...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EmailCampaign getCampaign() { return campaign; }
    public void setCampaign(EmailCampaign campaign) { this.campaign = campaign; }

    public Integer getClientId() { return clientId; }
    public void setClientId(Integer clientId) { this.clientId = clientId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
