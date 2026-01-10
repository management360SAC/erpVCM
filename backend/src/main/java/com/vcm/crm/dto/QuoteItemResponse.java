package com.vcm.crm.dto;

import java.math.BigDecimal;

public class QuoteItemResponse {
    public Long id;           // ✅ public, no private
    public Long serviceId;    // ✅ public, no private
    public String name;       // ✅ public, no private
    public BigDecimal cost;   // ✅ BigDecimal, no Double
}