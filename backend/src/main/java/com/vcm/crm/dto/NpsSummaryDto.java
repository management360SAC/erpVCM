// src/main/java/com/vcm/crm/dto/NpsSummaryDto.java
package com.vcm.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Resumen de NPS para el dashboard.
 * Equivale a NpsSummary en el front.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NpsSummaryDto {

    /** Valor NPS (puede ser negativo). */
    private double nps;

    /** Cantidad de promotores, pasivos y detractores. */
    private long promoters;
    private long passives;
    private long detractors;

    /** Total de respuestas consideradas para el cálculo. */
    private long total;

    /** Periodo usado para el cálculo (lo mostramos en la UI). */
    private LocalDate periodStart;
    private LocalDate periodEnd;

    // --- campos extra que usa tu nuevo dashboard ---

    /** Tasa de respuesta (0–100). */
    private double responseRate;

    /** Cantidad de respuestas recibidas. */
    private long responses;

    /** Cantidad de encuestas enviadas. */
    private long sent;

    /** CSAT promedio (si lo calculas; si no, puedes dejarlo en 0.0). */
    private Double csatAvg;
}
