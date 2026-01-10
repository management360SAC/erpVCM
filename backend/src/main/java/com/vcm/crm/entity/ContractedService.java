package com.vcm.crm.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracted_services")
public class ContractedService {

    // === A) EJECUCIÓN ===
    public enum ServiceStatus { PENDIENTE, EN_EJECUCION, COMPLETADO, CANCELADO }
    
    // === B) FACTURACIÓN ===
    public enum BillingStatus { NO_FACTURADO, FACTURADO_PARCIAL, FACTURADO_TOTAL }
    
    // === C) COBRO ===
    public enum CollectionStatus { PENDIENTE_COBRO, COBRO_PARCIAL, COBRADO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "`number`", nullable=false, unique=true, length=50)
    private String number;

    @Column(name = "quote_id")
    private Long quoteId;

    @Column(name = "client_id", nullable=false)
    private Long clientId;

    @Column(name = "org_id", nullable=false)
    private Long orgId;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=20)
    private ServiceStatus status = ServiceStatus.PENDIENTE;

    @Enumerated(EnumType.STRING)
    @Column(name="billing_status", nullable=false, length=20)
    private BillingStatus billingStatus = BillingStatus.NO_FACTURADO;

    @Enumerated(EnumType.STRING)
    @Column(name="collection_status", nullable=false, length=20)
    private CollectionStatus collectionStatus = CollectionStatus.PENDIENTE_COBRO;

    @Column(name="sub_total", nullable=false, precision=10, scale=2)
    private BigDecimal subTotal;

    @Column(nullable=false, precision=10, scale=2)
    private BigDecimal igv;

    @Column(nullable=false, precision=10, scale=2)
    private BigDecimal total;

    @Column(name="contract_date", nullable=false)
    private LocalDate contractDate;

    @Column(name="start_date")
    private LocalDate startDate;

    @Column(name="end_date")
    private LocalDate endDate;

    @Column(name="assigned_to")
    private Long assignedTo;

    @Column(columnDefinition="TEXT")
    private String notes;

    @Column(name="created_at", nullable=false, updatable=false)
    private LocalDateTime createdAt;

    @Column(name="created_by", nullable=false)
    private Long createdBy;

    @Column(name="updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (contractDate == null) contractDate = LocalDate.now();
    }
    
    @PreUpdate
    protected void onUpdate() { 
        updatedAt = LocalDateTime.now(); 
    }

    // Getters/Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }

    public Long getQuoteId() { return quoteId; }
    public void setQuoteId(Long quoteId) { this.quoteId = quoteId; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getOrgId() { return orgId; }
    public void setOrgId(Long orgId) { this.orgId = orgId; }

    public ServiceStatus getStatus() { return status; }
    public void setStatus(ServiceStatus status) { this.status = status; }

    public BillingStatus getBillingStatus() { return billingStatus; }
    public void setBillingStatus(BillingStatus billingStatus) { this.billingStatus = billingStatus; }

    public CollectionStatus getCollectionStatus() { return collectionStatus; }
    public void setCollectionStatus(CollectionStatus collectionStatus) { this.collectionStatus = collectionStatus; }

    public BigDecimal getSubTotal() { return subTotal; }
    public void setSubTotal(BigDecimal subTotal) { this.subTotal = subTotal; }

    public BigDecimal getIgv() { return igv; }
    public void setIgv(BigDecimal igv) { this.igv = igv; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public LocalDate getContractDate() { return contractDate; }
    public void setContractDate(LocalDate contractDate) { this.contractDate = contractDate; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Long getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Long assignedTo) { this.assignedTo = assignedTo; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
