package com.vcm.crm.dto;

import lombok.Data;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class ClientDtos {

    @Data
    public static class CreateClientRequest {
        @NotNull
        private Integer orgId;
        
        @NotBlank
        private String legalName;
        
        private String taxId;

        @Email
        private String email;

        private String phone;
    }

    @Data
    public static class UpdateClientRequest {
        private String legalName;
        private String taxId;

        @Email
        private String email;

        private String phone;
    }

    @Data
    public static class ClientResponse {
        private Integer id;
        private Integer orgId;
        private String legalName;
        private String taxId;
        private String email;
        private String phone;
    }
}
