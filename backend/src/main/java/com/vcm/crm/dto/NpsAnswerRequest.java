// src/main/java/com/vcm/crm/dto/nps/NpsAnswerRequest.java
package com.vcm.crm.dto;

import lombok.Data;

@Data
public class NpsAnswerRequest {
    private String token;
    private Integer score;
    private String comment;
}
