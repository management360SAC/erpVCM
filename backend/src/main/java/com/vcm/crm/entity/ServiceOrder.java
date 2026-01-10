package com.vcm.crm.entity;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "service_orders")
public class ServiceOrder {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "contracted_service_id", nullable = false)
  private Long contractedServiceId;

  @Column(name = "start_date")
  private LocalDate startDate;

  @Column(name = "end_date")
  private LocalDate endDate;

  @Column(length = 20, nullable = false)
  private String status = "ABIERTA"; // ABIERTA / CERRADA (simple y suficiente)

  // ===== Getters/Setters =====
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public Long getContractedServiceId() { return contractedServiceId; }
  public void setContractedServiceId(Long contractedServiceId) { this.contractedServiceId = contractedServiceId; }

  public LocalDate getStartDate() { return startDate; }
  public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

  public LocalDate getEndDate() { return endDate; }
  public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
}
