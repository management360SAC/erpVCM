package com.vcm.crm.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class AiDtos {

    @Data
    public static class AiChatRequest {
        @NotBlank
        @Size(max = 1000)
        private String message;

        @NotBlank
        private String contextType; // general|clientes|leads|cotizaciones|pagos|servicios|campanas|reportes
    }

    @Data
    public static class AiChatResponse {
        private String reply;
        public AiChatResponse(String reply) { this.reply = reply; }
    }
}
