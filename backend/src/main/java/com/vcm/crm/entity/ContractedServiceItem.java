// src/main/java/com/vcm/crm/entity/ContractedServiceItem.java
package com.vcm.crm.entity;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "contracted_service_items")
public class ContractedServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contracted_service_id", nullable = false)
    private Long contractedServiceId;

    @Column(name = "service_id", nullable = false)
    private Long serviceId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "line_total", precision = 10, scale = 2)
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
