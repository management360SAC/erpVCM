// src/main/java/com/vcm/crm/dto/NpsFiltersDto.java
package com.vcm.crm.dto;

import lombok.Data;
import java.time.LocalDate;

/**
 * Filtros que vienen del frontend para NPS.
 * Equivale a NpsFilters en el front.
 */
@Data
public class NpsFiltersDto {

    // rango de fechas (YYYY-MM-DD)
    private LocalDate from;
    private LocalDate to;

    // opcionales
    private Integer clientId;
    private Integer serviceId;
}
