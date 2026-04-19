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

    @NotNull
    @Min(0)
    @Max(10)
    private Integer score;

    private String comment;
}