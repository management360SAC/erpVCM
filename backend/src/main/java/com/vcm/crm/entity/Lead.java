package com.vcm.crm.entity;

import com.vcm.crm.model.LeadInterest;
import com.vcm.crm.model.LeadPriority;
import com.vcm.crm.model.LeadStatus;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leads") // <-- EN LA BD ES "leads"
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // --------- RELACIÓN CON lead_forms ----------
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id")
    private LeadForm form;

    // --------- TRACKING / UTM / FUENTE ----------
    @Column(name = "source_code")
    private String sourceCode;

    @Column(name = "utm_source")
    private String utmSource;

    @Column(name = "utm_medium")
    private String utmMedium;

    @Column(name = "utm_campaign")
    private String utmCampaign;

    @Column(name = "utm_term")
    private String utmTerm;

    @Column(name = "utm_content")
    private String utmContent;

    @Column(name = "referrer")
    private String referrer;

    @Column(name = "gclid")
    private String gclid;

    @Column(name = "fbclid")
    private String fbclid;

    // --------- DATOS DEL CONTACTO ----------
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "message")
    private String message;

    // --------- CAMPOS NUEVOS CRM (INFO DEL CLIENTE) ----------
    @Column(name = "company")
    private String company;

    @Column(name = "service_name")
    private String serviceName;

    @Enumerated(EnumType.STRING)
    @Column(name = "interest")
    private LeadInterest interest;      // INFO, QUOTE, HIRE, OTHER

    @Column(name = "budget_range")
    private String budgetRange;

    @Column(name = "timeframe")
    private String timeframe;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    private LeadPriority priority;      // HIGH, MEDIUM, LOW

    // --------- ESTADO / OWNER / FECHAS ----------
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LeadStatus status = LeadStatus.NEW;  // NEW, IN_PROGRESS, ...

    @Column(name = "owner_name")
    private String ownerName;

    @Column(name = "next_action_date")
    private LocalDate nextActionDate;

    // --------- RELACIÓN CON CLIENTE / SERVICIO (si lo usas) ----------
    @Column(name = "client_id")
    private Integer clientId;

    @Column(name = "service_id")
    private Integer serviceId;

    @Column(name = "raw_payload")
    private String rawPayload;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ================== GETTERS & SETTERS ==================

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public LeadForm getForm() { return form; }
    public void setForm(LeadForm form) { this.form = form; }

    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }

    public String getUtmSource() { return utmSource; }
    public void setUtmSource(String utmSource) { this.utmSource = utmSource; }

    public String getUtmMedium() { return utmMedium; }
    public void setUtmMedium(String utmMedium) { this.utmMedium = utmMedium; }

    public String getUtmCampaign() { return utmCampaign; }
    public void setUtmCampaign(String utmCampaign) { this.utmCampaign = utmCampaign; }

    public String getUtmTerm() { return utmTerm; }
    public void setUtmTerm(String utmTerm) { this.utmTerm = utmTerm; }

    public String getUtmContent() { return utmContent; }
    public void setUtmContent(String utmContent) { this.utmContent = utmContent; }

    public String getReferrer() { return referrer; }
    public void setReferrer(String referrer) { this.referrer = referrer; }

    public String getGclid() { return gclid; }
    public void setGclid(String gclid) { this.gclid = gclid; }

    public String getFbclid() { return fbclid; }
    public void setFbclid(String fbclid) { this.fbclid = fbclid; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public LeadInterest getInterest() { return interest; }
    public void setInterest(LeadInterest interest) { this.interest = interest; }

    public String getBudgetRange() { return budgetRange; }
    public void setBudgetRange(String budgetRange) { this.budgetRange = budgetRange; }

    public String getTimeframe() { return timeframe; }
    public void setTimeframe(String timeframe) { this.timeframe = timeframe; }

    public LeadPriority getPriority() { return priority; }
    public void setPriority(LeadPriority priority) { this.priority = priority; }

    public LeadStatus getStatus() { return status; }
    public void setStatus(LeadStatus status) { this.status = status; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public LocalDate getNextActionDate() { return nextActionDate; }
    public void setNextActionDate(LocalDate nextActionDate) { this.nextActionDate = nextActionDate; }

    public Integer getClientId() { return clientId; }
    public void setClientId(Integer clientId) { this.clientId = clientId; }

    public Integer getServiceId() { return serviceId; }
    public void setServiceId(Integer serviceId) { this.serviceId = serviceId; }

    public String getRawPayload() { return rawPayload; }
    public void setRawPayload(String rawPayload) { this.rawPayload = rawPayload; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
