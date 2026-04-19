package com.vcm.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs para el módulo Reportes & Analítica.
 */
public class ReportDtos {

    // =========================================================
    // DASHBOARD
    // =========================================================

    public static class DashboardKpis {
        public long   totalClientes;
        public long   serviciosActivos;
        public long   serviciosPendientes;
        public BigDecimal pagosMesTotal;
        public long   pagosMesCount;
        public long   facturasAbiertas;
        public BigDecimal facturasPendienteMonto;
        public BigDecimal pipelineValue;
        public long   dealsAbiertas;
        public long   dealsGanadas;
        public long   leadsNuevosMes;

        // series para gráficas
        public List<SeriesPoint> pagosPorMes;      // últimos 12 meses
        public List<SeriesPoint> leadsPorMes;       // últimos 12 meses
        public List<CatPoint>    clientesPorSector; // top sectores

        public DashboardKpis() {}
    }

    public static class SeriesPoint {
        public String label;   // "2024-03"
        public BigDecimal value;
        public SeriesPoint(String label, BigDecimal value) {
            this.label = label; this.value = value;
        }
    }

    public static class CatPoint {
        public String category;
        public long   count;
        public CatPoint(String category, long count) {
            this.category = category; this.count = count;
        }
    }

    // =========================================================
    // REPORTE PAGOS
    // =========================================================

    public static class PagoRow {
        public Long   id;
        public String number;
        public String invoiceNumber;
        public String clientNombre;
        public BigDecimal amount;
        public String method;
        public String refCode;
        public LocalDateTime paidAt;
        public LocalDateTime createdAt;
    }

    public static class PagosResponse {
        public List<PagoRow> content;
        public int  page;
        public int  size;
        public long totalElements;
        public int  totalPages;
        public BigDecimal totalPagado;
        public PagosResponse() {}
    }

    // =========================================================
    // REPORTE CLIENTES
    // =========================================================

    public static class ClienteRow {
        public Integer id;
        public String  legalName;
        public String  taxId;
        public String  email;
        public String  phone;
        public long    serviciosCount;
        public BigDecimal totalFacturado;
    }

    public static class ClientesResponse {
        public List<ClienteRow> content;
        public int  page;
        public int  size;
        public long totalElements;
        public int  totalPages;
        public ClientesResponse() {}
    }

    // =========================================================
    // REPORTE PIPELINE (DEALS + LEADS)
    // =========================================================

    public static class DealRow {
        public Long   id;
        public String title;
        public String clientNombre;
        public BigDecimal amount;
        public String stage;
        public String status;
        public LocalDateTime createdAt;
    }

    public static class PipelineResponse {
        public List<DealRow> content;
        public int  page;
        public int  size;
        public long totalElements;
        public int  totalPages;
        public BigDecimal totalPipelineValue;
        public long dealsGanadas;
        public long dealsPerdidas;
        public PipelineResponse() {}
    }

    // =========================================================
    // AUDITORÍA
    // =========================================================

    public static class AuditoriaRow {
        public Long   id;
        public String reportKey;
        public String username;
        public String filtrosJson;
        public LocalDateTime createdAt;
    }

    public static class AuditoriaResponse {
        public List<AuditoriaRow> content;
        public int  page;
        public int  size;
        public long totalElements;
        public int  totalPages;
        public AuditoriaResponse() {}
    }
}
