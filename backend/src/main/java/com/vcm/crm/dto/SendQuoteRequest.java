package com.vcm.crm.dto;

import java.math.BigDecimal;
import java.util.List;

public class SendQuoteRequest {

    private Long clientId;          // puede venir null si es cliente nuevo
    private String sendTo;          // correo destino
    private List<Item> items;       // servicios cotizados
    private Totals totals;          // totales de la cotización
    private SendQuoteMeta meta;     // info extra (org, sector, deal, etc.)
    private String validUntil;      // fecha de vigencia como string (yyyy-MM-dd)

    // ===== getters / setters =====

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public String getSendTo() {
        return sendTo;
    }

    public void setSendTo(String sendTo) {
        this.sendTo = sendTo;
    }

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    public Totals getTotals() {
        return totals;
    }

    public void setTotals(Totals totals) {
        this.totals = totals;
    }

    public SendQuoteMeta getMeta() {
        return meta;
    }

    public void setMeta(SendQuoteMeta meta) {
        this.meta = meta;
    }

    public String getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(String validUntil) {
        this.validUntil = validUntil;
    }

    // ================== clases internas ==================

    public static class Item {
        private Long serviceId;
        private BigDecimal cost;
        private String name;

        public Long getServiceId() {
            return serviceId;
        }

        public void setServiceId(Long serviceId) {
            this.serviceId = serviceId;
        }

        public BigDecimal getCost() {
            return cost;
        }

        public void setCost(BigDecimal cost) {
            this.cost = cost;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    public static class Totals {
        private BigDecimal subTotal;
        private BigDecimal igv;
        private BigDecimal total;

        public BigDecimal getSubTotal() {
            return subTotal;
        }

        public void setSubTotal(BigDecimal subTotal) {
            this.subTotal = subTotal;
        }

        public BigDecimal getIgv() {
            return igv;
        }

        public void setIgv(BigDecimal igv) {
            this.igv = igv;
        }

        public BigDecimal getTotal() {
            return total;
        }

        public void setTotal(BigDecimal total) {
            this.total = total;
        }
    }
}
