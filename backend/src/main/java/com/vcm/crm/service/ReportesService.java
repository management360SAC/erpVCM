package com.vcm.crm.service;

import com.vcm.crm.dto.ReportDtos.*;

public interface ReportesService {

    DashboardKpis dashboard(Integer orgId, String from, String to);

    PagosResponse    pagos(Integer orgId, String from, String to,
                           String q, int page, int size);

    ClientesResponse clientes(Integer orgId, String q, int page, int size);

    PipelineResponse pipeline(Integer orgId, String from, String to,
                              String stage, String status, String q,
                              int page, int size);

    /** Genera CSV en memoria y lo devuelve como String. */
    String exportCsv(Integer orgId, String key,
                     String from, String to, String q, String extra);

    AuditoriaResponse auditoria(Integer orgId, int page, int size);

    /** Registra en audit_log la generación de un reporte. */
    void registrarAudit(Integer orgId, Integer userId,
                        String reportKey, String filtrosJson);
}
