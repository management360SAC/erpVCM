package com.vcm.crm.dto;

import com.vcm.crm.domain.quote.QuoteStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class QuoteResponse {
    public Long id;
    public String number;
    public Long clientId;
    public String sector;
    public BigDecimal subTotal;
    public BigDecimal igv;
    public BigDecimal total;
    public QuoteStatus status;
    public String emailTo;
    public String fileUrl;
    public Long fileSize;

    @JsonFormat(pattern = "yyyy-MM-dd") // 👈 para enviarlo como “2025-10-30”
    public LocalDate validUntil;

    public LocalDateTime createdAt;
}
