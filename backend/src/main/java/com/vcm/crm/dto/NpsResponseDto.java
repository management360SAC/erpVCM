// src/main/java/com/vcm/crm/dto/NpsResponseDto.java
package com.vcm.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Respuesta individual de NPS.
 * Equivale a NpsResponse en el front.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NpsResponseDto {

    private Integer id;

    private String clientName;
    private String serviceName;

    /** Puntuación NPS (0–10). */
    private int score;

    /** Comentario opcional del cliente. */
    private String comment;

    /** Fecha/hora de creación de la respuesta. */
    private LocalDateTime createdAt;

    /**
     * Label NPS normalizado.
     * El front lo usa para mostrar el "tipo" (Promoter / Passive / Detractor)
     * y también lo normaliza por si viene en otro idioma.
     *
     * Valores esperados:
     *   - "Promoter"
     *   - "Passive"
     *   - "Detractor"
     */
    private String label;
}
