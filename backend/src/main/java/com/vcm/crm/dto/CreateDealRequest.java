package com.vcm.crm.dto;

import java.math.BigDecimal;

public class CreateDealRequest {
    public String title;
    public Integer clientId;
    public Integer serviceId;
    public BigDecimal amount;
    public String currency;   // PEN|USD (opcional, default PEN)
    public String stage;      // opcional, default PROSPECTO

    /** Si no se envía clientId, se puede registrar un cliente nuevo al vuelo. */
    public NewClient newClient;

    public static class NewClient {
        public String legalName;
        public String taxId;
        public String email;
        public String phone;
    }
}
