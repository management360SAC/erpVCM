// src/main/java/com/vcm/crm/dto/ContractedServiceDTO.java
package com.vcm.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.vcm.crm.entity.ContractedService.ServiceStatus;
import com.vcm.crm.entity.ContractedService.BillingStatus;
import com.vcm.crm.entity.ContractedService.CollectionStatus;

public class ContractedServiceDTO {
    private Long id;
    private String number;
    private Long quoteId;
    private Long clientId;
    private Long orgId;

    private ServiceStatus status;
    private BillingStatus billingStatus;
    private CollectionStatus collectionStatus;

    private BigDecimal subTotal;
    private BigDecimal igv;
    private BigDecimal total;

    private LocalDate contractDate;
    private LocalDate startDate;
    private LocalDate endDate;

    private Long assignedTo;
    private String notes;

    private LocalDateTime createdAt;
    private Long createdBy;
    private LocalDateTime updatedAt;

    // NUEVO: items
    private List<ContractedServiceItemDTO> items;

    // ==== getters/setters ====
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

    // NUEVO: items
    public List<ContractedServiceItemDTO> getItems() { return items; }
    public void setItems(List<ContractedServiceItemDTO> items) { this.items = items; }
}
