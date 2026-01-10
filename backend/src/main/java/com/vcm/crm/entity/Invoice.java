package com.vcm.crm.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
public class Invoice {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long orgId;
  private Long clientId;
  private Long contractedServiceId;

  @Column(nullable = false, unique = true)
  private String number;

  private LocalDate issueDate;
  private LocalDate dueDate;

  private String currency;

  private BigDecimal subTotal;
  private BigDecimal igv;
  private BigDecimal total;

  private String status;
  private String notes;

  private LocalDateTime createdAt;
  private Long createdBy;
  private LocalDateTime updatedAt;

  public Invoice() {}

  // ===== Getters & Setters =====
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public Long getOrgId() { return orgId; }
  public void setOrgId(Long orgId) { this.orgId = orgId; }

  public Long getClientId() { return clientId; }
  public void setClientId(Long clientId) { this.clientId = clientId; }

  public Long getContractedServiceId() { return contractedServiceId; }
  public void setContractedServiceId(Long contractedServiceId) { this.contractedServiceId = contractedServiceId; }

  public String getNumber() { return number; }
  public void setNumber(String number) { this.number = number; }

  public LocalDate getIssueDate() { return issueDate; }
  public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }

  public LocalDate getDueDate() { return dueDate; }
  public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

  public String getCurrency() { return currency; }
  public void setCurrency(String currency) { this.currency = currency; }

  public BigDecimal getSubTotal() { return subTotal; }
  public void setSubTotal(BigDecimal subTotal) { this.subTotal = subTotal; }

  public BigDecimal getIgv() { return igv; }
  public void setIgv(BigDecimal igv) { this.igv = igv; }

  public BigDecimal getTotal() { return total; }
  public void setTotal(BigDecimal total) { this.total = total; }

  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }

  public String getNotes() { return notes; }
  public void setNotes(String notes) { this.notes = notes; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public Long getCreatedBy() { return createdBy; }
  public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
