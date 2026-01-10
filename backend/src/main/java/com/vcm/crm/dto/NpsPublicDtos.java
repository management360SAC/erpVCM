// src/main/java/com/vcm/crm/dto/NpsPublicDtos.java
package com.vcm.crm.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class NpsPublicDtos {

    public static class AnswerRequest {
        @NotBlank
        private String token;

        @NotNull
        @Min(0)
        @Max(10)
        private Integer score;

        private String comment;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }

        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }
    }
}
