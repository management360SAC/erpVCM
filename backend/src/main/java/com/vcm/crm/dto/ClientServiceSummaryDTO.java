// src/main/java/com/vcm/crm/dto/ClientServiceSummaryDTO.java
package com.vcm.crm.dto;

import java.time.LocalDate;

public class ClientServiceSummaryDTO {

  private Integer id;
  private Integer serviceId;
  private String serviceName;
  private Boolean isActive;
  private LocalDate startDate;
  private LocalDate endDate;

  public ClientServiceSummaryDTO() {}

  public ClientServiceSummaryDTO(Integer id,
                                 Integer serviceId,
                                 String serviceName,
                                 Boolean isActive,
                                 LocalDate startDate,
                                 LocalDate endDate) {
    this.id = id;
    this.serviceId = serviceId;
    this.serviceName = serviceName;
    this.isActive = isActive;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  public Integer getId() { return id; }
  public void setId(Integer id) { this.id = id; }

  public Integer getServiceId() { return serviceId; }
  public void setServiceId(Integer serviceId) { this.serviceId = serviceId; }

  public String getServiceName() { return serviceName; }
  public void setServiceName(String serviceName) { this.serviceName = serviceName; }

  public Boolean getIsActive() { return isActive; }
  public void setIsActive(Boolean isActive) { this.isActive = isActive; }

  public LocalDate getStartDate() { return startDate; }
  public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

  public LocalDate getEndDate() { return endDate; }
  public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
}
