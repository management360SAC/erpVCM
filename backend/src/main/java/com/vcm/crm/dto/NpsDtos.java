package com.vcm.crm.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class NpsDtos {

  @Data
  public static class NpsRequest {
    private LocalDate from;
    private LocalDate to;
    private Integer clientId;
    private Integer serviceId;
  }

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

    private Double responseRate;
    private Long responses;
    private Long sent;
    private Double csatAvg;

    // Promedios por pregunta (1-5)
    private Double avgQ1;
    private Double avgQ2;
    private Double avgQ3;
    private Double avgQ4;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class NpsResponseDto {
    private Integer id;
    private String clientName;
    private String serviceName;
    private Integer q1;
    private Integer q2;
    private Integer q3;
    private Integer q4;
    private int score;
    private String comment;
    private LocalDateTime createdAt;
    private String label;
  }
}
