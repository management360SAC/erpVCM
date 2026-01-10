package com.vcm.crm.controller;

import com.vcm.crm.dto.ServiceTrackingDtos.ExpiryRow;
import com.vcm.crm.dto.ServiceTrackingDtos.Summary;
import com.vcm.crm.dto.ServiceTrackingRequest;
import com.vcm.crm.service.ServiceTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ops/service-tracking")
@RequiredArgsConstructor
public class ServiceTrackingController {

  private final ServiceTrackingService serviceTrackingService;

  /**
   * Resumen (activos / por vencer / vencidos)
   * POST /api/ops/service-tracking/summary
   * Body: { "withinDays": 30 }
   */
  @PostMapping("/summary")
  public Summary getSummary(@RequestBody ServiceTrackingRequest request) {
    Integer withinDays = request.getWithinDays() != null ? request.getWithinDays() : 30;
    return serviceTrackingService.getSummary(withinDays);
  }

  /**
   * Servicios que expiran en los próximos N días
   * POST /api/ops/service-tracking/expiring
   * Body: { "withinDays": 30 }
   */
  @PostMapping("/expiring")
  public List<ExpiryRow> getExpiring(@RequestBody ServiceTrackingRequest request) {
    Integer withinDays = request.getWithinDays() != null ? request.getWithinDays() : 30;
    return serviceTrackingService.findExpiring(withinDays);
  }

  /**
   * Servicios ya expirados
   * POST /api/ops/service-tracking/expired
   */
  @PostMapping("/expired")
  public List<ExpiryRow> getExpired() {
    return serviceTrackingService.findExpired();
  }

  /**
   * Servicios activos con fecha fin > hoy
   * POST /api/ops/service-tracking/active
   */
  @PostMapping("/active")
  public List<ExpiryRow> getActive() {
    return serviceTrackingService.findActive();
  }
}
