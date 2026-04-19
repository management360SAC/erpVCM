package com.vcm.crm.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_audit_log")
public class ReportAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false)
    private Integer orgId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "report_key", nullable = false, length = 50)
    private String reportKey;

    @Column(name = "filtros_json", columnDefinition = "JSON")
    private String filtrosJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ReportAuditLog() {}

    public ReportAuditLog(Integer orgId, Integer userId, String reportKey, String filtrosJson) {
        this.orgId      = orgId;
        this.userId     = userId;
        this.reportKey  = reportKey;
        this.filtrosJson = filtrosJson;
    }

    public Long getId()                   { return id; }
    public Integer getOrgId()             { return orgId; }
    public Integer getUserId()            { return userId; }
    public String getReportKey()          { return reportKey; }
    public String getFiltrosJson()        { return filtrosJson; }
    public LocalDateTime getCreatedAt()   { return createdAt; }
    public void setOrgId(Integer orgId)   { this.orgId = orgId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public void setReportKey(String k)    { this.reportKey = k; }
    public void setFiltrosJson(String j)  { this.filtrosJson = j; }
}
