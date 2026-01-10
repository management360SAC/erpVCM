package com.vcm.crm.dto;

import java.math.BigDecimal;

public class ContractedServiceItemDTO {
    private Long id;
    private Long contractedServiceId;
    private Long serviceId;
    private String name;
    private String description;
    private BigDecimal cost;
    private Integer quantity;
    private BigDecimal lineTotal;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getContractedServiceId() { return contractedServiceId; }
    public void setContractedServiceId(Long contractedServiceId) { this.contractedServiceId = contractedServiceId; }
    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getLineTotal() { return lineTotal; }
    public void setLineTotal(BigDecimal lineTotal) { this.lineTotal = lineTotal; }
}
