package com.vcm.crm.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTOs agrupados para NPS (encuestas de satisfacción).
 *
 * IMPORTANTE:
 *  - El archivo debe llamarse EXACTAMENTE NpsDtos.java
 *  - Debe estar en el paquete com.vcm.crm.dto
 */
public class NpsDtos {

  // =========================
  //  Request desde el front
  // =========================
  @Data
  public static class NpsRequest {
    /**
     * Rango de fechas (incluyente) en formato LocalDate.
     * En el front se envían como "YYYY-MM-DD".
     */
    private LocalDate from;
    private LocalDate to;

    /** Opcional: filtrar por cliente */
    private Integer clientId;

    /** Opcional: filtrar por servicio */
    private Integer serviceId;
  }

  // =========================
  //  Resumen NPS
  // =========================
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class NpsSummaryDto {
    private double nps;
    private long promoters;
    private long passives;
    private long detractors;
    private long total;

    private LocalDate periodStart;
    private LocalDate periodEnd;

    // Campos extra que usa el dashboard
    private Double responseRate; // porcentaje 0-100
    private Long responses;      // # respuestas recibidas
    private Long sent;           // # encuestas enviadas
    private Double csatAvg;      // promedio CSAT (si lo usas)
  }

  // =========================
  //  Respuesta individual NPS
  // =========================
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class NpsResponseDto {
    private Integer id;
    private String clientName;
    private String serviceName;
    private int score;               // 0-10
    private String comment;          // comentario opcional
    private LocalDateTime createdAt; // fecha/hora de respuesta

    /**
     * Label (Promoter / Passive / Detractor).
     * Puede ser null y el front lo recalcula si quiere.
     */
    private String label;
  }
}
