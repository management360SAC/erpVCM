package com.vcm.crm.dto;

import lombok.Data;
import java.util.List;

public class ImportDtos {

    @Data
    public static class ImportPreviewRow {
        private int fila;
        // Datos del cliente
        private String razonSocial;
        private String sector;
        private String contacto;
        private String emailDetectado;
        private boolean clienteExistente;
        // Deal
        private String tipoServicio;
        private String detalleServicio;
        private String fechaCotizacion;
        private String nroCotizacionExterno;
        private String fechaAprobacion;
        private String nroContrato;
        private Double precioSoles;
        private Double precioUsd;
        private String monedaUsada;
        private String estado;
        private String stageCrm;
        private String statusCrm;
        private String notas;
        // Facturación
        private String factura;
        private Double cobro;
        private Double saldoCobrar;

        private List<CampoIgnorado> camposIgnorados;
    }

    @Data
    public static class CampoIgnorado {
        private String columna;
        private String valor;
        private String motivo;

        public CampoIgnorado(String columna, String valor, String motivo) {
            this.columna = columna;
            this.valor = valor;
            this.motivo = motivo;
        }
    }

    @Data
    public static class ImportPreviewResponse {
        private int totalFilas;
        private int filasValidas;
        private List<ImportPreviewRow> filas;
        private List<String> columnasNoImportadas;
    }

    @Data
    public static class ImportResultRow {
        private int fila;
        private boolean exito;
        private String mensaje;
        private Long clienteId;
        private Long dealId;
    }

    @Data
    public static class ImportResultResponse {
        private int totalProcesadas;
        private int exitosas;
        private int fallidas;
        private List<ImportResultRow> detalle;
    }
}
