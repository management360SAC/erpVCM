package com.vcm.crm.dto;

import com.vcm.crm.entity.BillingModel;
import lombok.Data;

import javax.validation.constraints.*;
import java.math.BigDecimal;

public class ServiceDtos {

    @Data
    public static class CreateServiceRequest {
        @NotNull
        private Integer orgId;

        @NotBlank
        private String name;

        // Siempre debe venir MENSUAL desde el FE (aunque igual lo forzaremos en el backend)
        private BillingModel billingModel;

        @NotNull
        @DecimalMin("0.0")
        @Digits(integer = 8, fraction = 2)
        private BigDecimal basePrice;
    }

    @Data
    public static class UpdateServiceRequest {
        private String name;
        private BillingModel billingModel;
        
        @DecimalMin("0.0")
        @Digits(integer = 8, fraction = 2)
        private BigDecimal basePrice;

        private Boolean isActive;
    }

    @Data
    public static class ServiceResponse {
        private Integer id;
        private Integer orgId;
        private String name;
        private BillingModel billingModel;
        private BigDecimal basePrice;
        private Boolean isActive;
    }
}
