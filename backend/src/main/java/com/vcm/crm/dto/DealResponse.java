package com.vcm.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DealResponse {
    public Long id;
    public String title;
    public String clientName;
    public BigDecimal amount;
    public String ownerName;
    public String stage;
    public String status;
    public LocalDateTime createdAt;
    public Integer probability;
}
