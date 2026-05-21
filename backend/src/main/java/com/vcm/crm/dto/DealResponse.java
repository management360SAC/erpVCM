package com.vcm.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DealResponse {
    public Long id;
    public String title;
    public String clientName;
    public BigDecimal amount;
    public String currency;
    public String ownerName;
    public String stage;
    public String status;
    public LocalDateTime createdAt;
    public Integer probability;
    // Campos extendidos (importación masiva)
    public String serviceType;
    public java.time.LocalDate approvalDate;
    public String contractReference;
    public String externalQuoteNumber;
    public String invoiceReference;
    public BigDecimal collectedAmount;
    public BigDecimal balanceAmount;
    public String clientSector;
}
