package com.vcm.crm.dto;

import lombok.Data;

@Data
public class ServiceTrackingRequest {
  // cantidad de días hacia adelante para chequear vencimientos
  private Integer withinDays; // p.ej. 30
}
