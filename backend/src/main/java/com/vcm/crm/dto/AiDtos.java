package com.vcm.crm.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class AiDtos {

    @Data
    public static class AiChatRequest {
        @NotBlank
        @Size(max = 2000)
        private String message;

        @NotBlank
        private String contextType;
    }

    @Data
    public static class AiChatResponse {
        private String reply;
        public AiChatResponse(String reply) { this.reply = reply; }
    }

    @Data
    public static class AiImageRequest {
        @NotBlank
        @Size(max = 500)
        private String prompt;
    }

    @Data
    public static class AiImageResponse {
        private String imageUrl;
        private String message;
        public AiImageResponse(String imageUrl, String message) {
            this.imageUrl = imageUrl;
            this.message  = message;
        }
    }
}
