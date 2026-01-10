// Crear este archivo en: backend/src/main/java/com/vcm/crm/dto/ServiceTrackingSummary.java
package com.vcm.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceTrackingSummary {
  private Integer totalActive;
  private Integer expiringSoon;
  private Integer expired;
  private Integer windowDays;
}