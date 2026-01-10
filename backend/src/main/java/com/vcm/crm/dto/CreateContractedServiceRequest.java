// src/main/java/com/vcm/crm/dto/CreateContractedServiceRequest.java
package com.vcm.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.vcm.crm.entity.ContractedService.ServiceStatus;

public class CreateContractedServiceRequest {
    private Long quoteId;
    private Long clientId;

    private ServiceStatus status;

    private BigDecimal subTotal;
    private BigDecimal igv;
    private BigDecimal total;

    private LocalDate contractDate;
    private LocalDate startDate;
    private LocalDate endDate;

    private Long assignedTo;
    private String notes;

    // NUEVO: items
    private List<ContractedServiceItemDTO> items;

    // ==== getters/setters ====
    public Long getQuoteId() { return quoteId; }
    public void setQuoteId(Long quoteId) { this.quoteId = quoteId; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public ServiceStatus getStatus() { return status; }
    public void setStatus(ServiceStatus status) { this.status = status; }

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

    // NUEVO: items
    public List<ContractedServiceItemDTO> getItems() { return items; }
    public void setItems(List<ContractedServiceItemDTO> items) { this.items = items; }
}
