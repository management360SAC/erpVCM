package com.vcm.crm.dto;

import java.math.BigDecimal;
import java.util.List;

public class CreateQuoteRequest {
  public Integer orgId;        // opcional en raíz
  public Long clientId;
  public String sector;        // opcional en raíz
  public String emailTo;       // forma 1 (preferida)
  public String sendTo;        // compatibilidad con el front actual
  public Totals totals;
  public List<Item> items;
  public String notes;
  public String validUntil;    // ISO-8601 (opcional), ej: "2025-11-30"

  public Meta meta;            // compatibilidad con el front actual

  public static class Meta {
    public Integer orgId;      // llega desde el front
    public String sector;      // llega desde el front
  }

  public static class Totals {
    public BigDecimal subTotal;
    public BigDecimal igv;
    public BigDecimal total;
  }

  public static class Item {
    public Integer serviceId;
    public String name;
    public BigDecimal cost;
  }
}
