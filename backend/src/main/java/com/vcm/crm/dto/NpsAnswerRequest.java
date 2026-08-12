package com.vcm.crm.dto;

import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class NpsAnswerRequest {

    @NotBlank
    private String token;

    // Pregunta 1: Calidad general del servicio (1-5)
    @NotNull @Min(1) @Max(5)
    private Integer q1;

    // Pregunta 2: Comunicación y atención del equipo (1-5)
    @NotNull @Min(1) @Max(5)
    private Integer q2;

    // Pregunta 3: Cumplimiento de plazos (1-5)
    @NotNull @Min(1) @Max(5)
    private Integer q3;

    // Pregunta 4: Satisfacción con los resultados (1-5)
    @NotNull @Min(1) @Max(5)
    private Integer q4;

    // Pregunta 5 / NPS: Probabilidad de recomendación (0-10)
    @NotNull @Min(0) @Max(10)
    private Integer score;

    private String comment;
}
