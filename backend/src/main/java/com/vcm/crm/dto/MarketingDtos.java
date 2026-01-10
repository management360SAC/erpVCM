// src/main/java/com/vcm/crm/dto/MarketingDtos.java
package com.vcm.crm.dto;

import java.math.BigDecimal;

public class MarketingDtos {

    public static class IntakeLeadRequest {
        public Integer orgId;
        public String sourceChannel; // EMAIL, ADS, LANDING
        public String sourceDetail;
        public String name;
        public String email;
        public String phone;
        public String companyName;
        public BigDecimal estimatedAmount;
        public Long ownerUserId; // opcional
    }

    public static class IntakeLeadResponse {
        public Long leadId;
        public Long dealId;
    }
}
