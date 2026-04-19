package com.vcm.crm.service;

import com.vcm.crm.dto.ReportDtos.*;
import com.vcm.crm.entity.ReportAuditLog;
import com.vcm.crm.repository.ReportAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportesServiceImpl implements ReportesService {

    private final EntityManager em;
    private final ReportAuditLogRepository auditRepo;

    // =========================================================
    // DASHBOARD KPIs
    // =========================================================

    @Override
    public DashboardKpis dashboard(Integer orgId, String from, String to) {
        DashboardKpis kpis = new DashboardKpis();
        LocalDateTime dtFrom = parseFrom(from);
        LocalDateTime dtTo   = parseTo(to);

        kpis.totalClientes = count(
            "SELECT COUNT(*) FROM clients WHERE org_id = :orgId", "orgId", orgId);

        kpis.serviciosActivos = count(
            "SELECT COUNT(*) FROM contracted_services WHERE org_id = :orgId AND status = 'EN_EJECUCION'",
            "orgId", orgId);
        kpis.serviciosPendientes = count(
            "SELECT COUNT(*) FROM contracted_services WHERE org_id = :orgId AND status = 'PENDIENTE'",
            "orgId", orgId);

        // Pagos en rango
        @SuppressWarnings("unchecked")
        List<Object[]> pagosAgg = em.createNativeQuery(
            "SELECT COALESCE(SUM(p.amount),0), COUNT(*) " +
            "FROM payments p INNER JOIN invoices i ON i.id = p.invoice_id " +
            "WHERE i.org_id = :orgId AND p.paid_at BETWEEN :from AND :to")
            .setParameter("orgId", orgId)
            .setParameter("from",  dtFrom)
            .setParameter("to",    dtTo)
            .getResultList();
        if (!pagosAgg.isEmpty()) {
            Object[] r = pagosAgg.get(0);
            kpis.pagosMesTotal = toBD(r[0]);
            kpis.pagosMesCount = toLong(r[1]);
        }

        // Facturas abiertas
        @SuppressWarnings("unchecked")
        List<Object[]> facAgg = em.createNativeQuery(
            "SELECT COUNT(*), COALESCE(SUM(total),0) FROM invoices " +
            "WHERE org_id = :orgId AND status IN ('EMITIDA','PENDIENTE','VENCIDA','PENDIENTE_PAGO')")
            .setParameter("orgId", orgId)
            .getResultList();
        if (!facAgg.isEmpty()) {
            Object[] r = facAgg.get(0);
            kpis.facturasAbiertas       = toLong(r[0]);
            kpis.facturasPendienteMonto = toBD(r[1]);
        }

        // Pipeline OPEN
        @SuppressWarnings("unchecked")
        List<Object[]> pipeAgg = em.createNativeQuery(
            "SELECT COALESCE(SUM(amount),0), COUNT(*) FROM deal WHERE org_id = :orgId AND status = 'OPEN'")
            .setParameter("orgId", orgId)
            .getResultList();
        if (!pipeAgg.isEmpty()) {
            Object[] r = pipeAgg.get(0);
            kpis.pipelineValue = toBD(r[0]);
            kpis.dealsAbiertas = toLong(r[1]);
        }

        kpis.dealsGanadas = count(
            "SELECT COUNT(*) FROM deal WHERE org_id = :orgId AND status = 'WON' " +
            "AND created_at BETWEEN :from AND :to",
            "orgId", orgId, "from", dtFrom, "to", dtTo);

        kpis.leadsNuevosMes = count(
            "SELECT COUNT(*) FROM marketing_lead WHERE org_id = :orgId AND created_at BETWEEN :from AND :to",
            "orgId", orgId, "from", dtFrom, "to", dtTo);

        kpis.pagosPorMes       = pagosPorMesSeries(orgId);
        kpis.leadsPorMes       = leadsPorMesSeries(orgId);
        kpis.clientesPorSector = clientesPorSector(orgId);

        return kpis;
    }

    @SuppressWarnings("unchecked")
    private List<SeriesPoint> pagosPorMesSeries(Integer orgId) {
        List<Object[]> rows = em.createNativeQuery(
            "SELECT DATE_FORMAT(p.paid_at,'%Y-%m') AS mes, COALESCE(SUM(p.amount),0) " +
            "FROM payments p INNER JOIN invoices i ON i.id = p.invoice_id " +
            "WHERE i.org_id = :orgId " +
            "  AND p.paid_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) " +
            "GROUP BY mes ORDER BY mes")
            .setParameter("orgId", orgId)
            .getResultList();
        List<SeriesPoint> list = new ArrayList<>();
        for (Object[] r : rows) list.add(new SeriesPoint(str(r[0]), toBD(r[1])));
        return list;
    }

    @SuppressWarnings("unchecked")
    private List<SeriesPoint> leadsPorMesSeries(Integer orgId) {
        List<Object[]> rows = em.createNativeQuery(
            "SELECT DATE_FORMAT(created_at,'%Y-%m') AS mes, COUNT(*) " +
            "FROM marketing_lead WHERE org_id = :orgId " +
            "  AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) " +
            "GROUP BY mes ORDER BY mes")
            .setParameter("orgId", orgId)
            .getResultList();
        List<SeriesPoint> list = new ArrayList<>();
        for (Object[] r : rows)
            list.add(new SeriesPoint(str(r[0]), BigDecimal.valueOf(toLong(r[1]))));
        return list;
    }

    @SuppressWarnings("unchecked")
    private List<CatPoint> clientesPorSector(Integer orgId) {
        List<Object[]> rows = em.createNativeQuery(
            "SELECT COALESCE(CAST(sector_id AS CHAR),'Sin sector'), COUNT(*) " +
            "FROM clients WHERE org_id = :orgId " +
            "GROUP BY sector_id ORDER BY COUNT(*) DESC LIMIT 8")
            .setParameter("orgId", orgId)
            .getResultList();
        List<CatPoint> list = new ArrayList<>();
        for (Object[] r : rows) list.add(new CatPoint(str(r[0]), toLong(r[1])));
        return list;
    }

    // =========================================================
    // REPORTE PAGOS
    // =========================================================

    @Override
    @SuppressWarnings("unchecked")
    public PagosResponse pagos(Integer orgId, String from, String to,
                               String q, int page, int size) {
        LocalDateTime dtFrom = parseFrom(from);
        LocalDateTime dtTo   = parseTo(to);
        boolean hasLike = q != null && !q.trim().isEmpty();
        String like = hasLike ? "%" + q.trim() + "%" : null;

        String likeClause = hasLike
            ? "AND (c.legal_name LIKE :like OR i.number LIKE :like OR p.number LIKE :like) "
            : "";

        String baseWhere =
            "FROM payments p " +
            "INNER JOIN invoices i ON i.id = p.invoice_id " +
            "LEFT  JOIN clients  c ON c.id = i.client_id " +
            "WHERE i.org_id = :orgId AND p.paid_at BETWEEN :from AND :to " +
            likeClause;

        // Count
        Query cq = em.createNativeQuery("SELECT COUNT(*) " + baseWhere)
            .setParameter("orgId", orgId)
            .setParameter("from",  dtFrom)
            .setParameter("to",    dtTo);
        if (hasLike) cq.setParameter("like", like);
        long total = toLong(cq.getSingleResult());

        // Data
        Query dq = em.createNativeQuery(
            "SELECT p.id, p.number AS pago_num, i.number AS factura_num, c.legal_name, " +
            "       p.amount, p.method, p.ref_code, p.paid_at, p.created_at " +
            baseWhere + "ORDER BY p.paid_at DESC LIMIT :lim OFFSET :off")
            .setParameter("orgId", orgId)
            .setParameter("from",  dtFrom)
            .setParameter("to",    dtTo)
            .setParameter("lim",   size)
            .setParameter("off",   page * size);
        if (hasLike) dq.setParameter("like", like);

        // Total pagado
        Query tq = em.createNativeQuery(
            "SELECT COALESCE(SUM(p.amount),0) " + baseWhere)
            .setParameter("orgId", orgId)
            .setParameter("from",  dtFrom)
            .setParameter("to",    dtTo);
        if (hasLike) tq.setParameter("like", like);
        BigDecimal totalPagado = toBD(tq.getSingleResult());

        List<PagoRow> content = new ArrayList<>();
        for (Object[] r : (List<Object[]>) dq.getResultList()) {
            PagoRow row = new PagoRow();
            row.id            = toLong(r[0]);
            row.number        = str(r[1]);
            row.invoiceNumber = str(r[2]);
            row.clientNombre  = str(r[3]);
            row.amount        = toBD(r[4]);
            row.method        = str(r[5]);
            row.refCode       = str(r[6]);
            row.paidAt        = toDateTime(r[7]);
            row.createdAt     = toDateTime(r[8]);
            content.add(row);
        }

        PagosResponse resp = new PagosResponse();
        resp.content       = content;
        resp.page          = page;
        resp.size          = size;
        resp.totalElements = total;
        resp.totalPages    = (int) Math.ceil((double) total / size);
        resp.totalPagado   = totalPagado;
        return resp;
    }

    // =========================================================
    // REPORTE CLIENTES
    // =========================================================

    @Override
    @SuppressWarnings("unchecked")
    public ClientesResponse clientes(Integer orgId, String q, int page, int size) {
        boolean hasLike = q != null && !q.trim().isEmpty();
        String like = hasLike ? "%" + q.trim() + "%" : null;

        String likeClause = hasLike
            ? "AND (c.legal_name LIKE :like OR c.email LIKE :like OR c.tax_id LIKE :like) "
            : "";

        String baseWhere = "FROM clients c WHERE c.org_id = :orgId " + likeClause;

        Query cq = em.createNativeQuery("SELECT COUNT(*) " + baseWhere)
            .setParameter("orgId", orgId);
        if (hasLike) cq.setParameter("like", like);
        long total = toLong(cq.getSingleResult());

        Query dq = em.createNativeQuery(
            "SELECT c.id, c.legal_name, c.tax_id, c.email, c.phone, " +
            "       (SELECT COUNT(*) FROM contracted_services cs WHERE cs.client_id = c.id) AS svc_count, " +
            "       (SELECT COALESCE(SUM(inv.total),0) FROM invoices inv " +
            "        WHERE inv.client_id = c.id AND inv.org_id = :orgId) AS total_fac " +
            baseWhere + "ORDER BY c.legal_name LIMIT :lim OFFSET :off")
            .setParameter("orgId", orgId)
            .setParameter("lim",   size)
            .setParameter("off",   page * size);
        if (hasLike) dq.setParameter("like", like);

        List<ClienteRow> content = new ArrayList<>();
        for (Object[] r : (List<Object[]>) dq.getResultList()) {
            ClienteRow row = new ClienteRow();
            row.id             = toInt(r[0]);
            row.legalName      = str(r[1]);
            row.taxId          = str(r[2]);
            row.email          = str(r[3]);
            row.phone          = str(r[4]);
            row.serviciosCount = toLong(r[5]);
            row.totalFacturado = toBD(r[6]);
            content.add(row);
        }

        ClientesResponse resp = new ClientesResponse();
        resp.content       = content;
        resp.page          = page;
        resp.size          = size;
        resp.totalElements = total;
        resp.totalPages    = (int) Math.ceil((double) total / size);
        return resp;
    }

    // =========================================================
    // REPORTE PIPELINE
    // =========================================================

    @Override
    @SuppressWarnings("unchecked")
    public PipelineResponse pipeline(Integer orgId, String from, String to,
                                     String stage, String status, String q,
                                     int page, int size) {
        LocalDateTime dtFrom = parseFrom(from);
        LocalDateTime dtTo   = parseTo(to);
        boolean hasLike   = q      != null && !q.trim().isEmpty();
        boolean hasStage  = stage  != null && !stage.trim().isEmpty();
        boolean hasStatus = status != null && !status.trim().isEmpty();
        String like = hasLike ? "%" + q.trim() + "%" : null;

        StringBuilder baseWhere = new StringBuilder(
            "FROM deal d LEFT JOIN clients c ON c.id = d.client_id " +
            "WHERE d.org_id = :orgId AND d.created_at BETWEEN :from AND :to ");
        if (hasStage)  baseWhere.append("AND d.stage = :stage ");
        if (hasStatus) baseWhere.append("AND d.status = :status ");
        if (hasLike)   baseWhere.append("AND (d.title LIKE :like OR c.legal_name LIKE :like) ");

        Query cq = em.createNativeQuery("SELECT COUNT(*) " + baseWhere)
            .setParameter("orgId", orgId)
            .setParameter("from",  dtFrom)
            .setParameter("to",    dtTo);
        Query dq = em.createNativeQuery(
            "SELECT d.id, d.title, c.legal_name, d.amount, d.stage, d.status, d.created_at " +
            baseWhere + "ORDER BY d.created_at DESC LIMIT :lim OFFSET :off")
            .setParameter("orgId", orgId)
            .setParameter("from",  dtFrom)
            .setParameter("to",    dtTo)
            .setParameter("lim",   size)
            .setParameter("off",   page * size);

        if (hasStage)  { cq.setParameter("stage",  stage);  dq.setParameter("stage",  stage);  }
        if (hasStatus) { cq.setParameter("status", status); dq.setParameter("status", status); }
        if (hasLike)   { cq.setParameter("like",   like);   dq.setParameter("like",   like);   }

        long total = toLong(cq.getSingleResult());

        // Agregados totales (sin paginación)
        Object[] agg = (Object[]) em.createNativeQuery(
            "SELECT COALESCE(SUM(d.amount),0), " +
            "SUM(CASE WHEN d.status='WON' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN d.status='LOST' THEN 1 ELSE 0 END) " +
            "FROM deal d LEFT JOIN clients c ON c.id = d.client_id " +
            "WHERE d.org_id = :orgId AND d.created_at BETWEEN :from AND :to")
            .setParameter("orgId", orgId)
            .setParameter("from",  dtFrom)
            .setParameter("to",    dtTo)
            .getSingleResult();

        List<DealRow> content = new ArrayList<>();
        for (Object[] r : (List<Object[]>) dq.getResultList()) {
            DealRow row = new DealRow();
            row.id           = toLong(r[0]);
            row.title        = str(r[1]);
            row.clientNombre = str(r[2]);
            row.amount       = toBD(r[3]);
            row.stage        = str(r[4]);
            row.status       = str(r[5]);
            row.createdAt    = toDateTime(r[6]);
            content.add(row);
        }

        PipelineResponse resp = new PipelineResponse();
        resp.content            = content;
        resp.page               = page;
        resp.size               = size;
        resp.totalElements      = total;
        resp.totalPages         = (int) Math.ceil((double) total / size);
        resp.totalPipelineValue = toBD(agg[0]);
        resp.dealsGanadas       = toLong(agg[1]);
        resp.dealsPerdidas      = toLong(agg[2]);
        return resp;
    }

    // =========================================================
    // EXPORT CSV
    // =========================================================

    @Override
    public String exportCsv(Integer orgId, String key,
                             String from, String to, String q, String extra) {
        switch (key) {
            case "pagos":    return csvPagos(orgId, from, to, q);
            case "clientes": return csvClientes(orgId, q);
            case "pipeline": return csvPipeline(orgId, from, to, q);
            default:         return "Sin datos";
        }
    }

    @SuppressWarnings("unchecked")
    private String csvPagos(Integer orgId, String from, String to, String q) {
        LocalDateTime dtFrom = parseFrom(from);
        LocalDateTime dtTo   = parseTo(to);
        boolean hasLike = q != null && !q.trim().isEmpty();
        String like = hasLike ? "%" + q.trim() + "%" : null;

        String likeClause = hasLike
            ? "AND (c.legal_name LIKE :like OR i.number LIKE :like OR p.number LIKE :like) "
            : "";

        Query dq = em.createNativeQuery(
            "SELECT p.number AS pago_num, i.number AS factura_num, " +
            "       c.legal_name, p.amount, p.method, p.ref_code, p.paid_at " +
            "FROM payments p " +
            "INNER JOIN invoices i ON i.id = p.invoice_id " +
            "LEFT  JOIN clients  c ON c.id = i.client_id " +
            "WHERE i.org_id = :orgId AND p.paid_at BETWEEN :from AND :to " +
            likeClause +
            "ORDER BY p.paid_at DESC")
            .setParameter("orgId", orgId)
            .setParameter("from",  dtFrom)
            .setParameter("to",    dtTo);
        if (hasLike) dq.setParameter("like", like);

        StringBuilder sb = new StringBuilder("Num Pago,Num Factura,Cliente,Monto,Método,Referencia,Fecha\n");
        for (Object[] r : (List<Object[]>) dq.getResultList()) {
            sb.append(csv(str(r[0]))).append(',')
              .append(csv(str(r[1]))).append(',')
              .append(csv(str(r[2]))).append(',')
              .append(toBD(r[3])).append(',')
              .append(csv(str(r[4]))).append(',')
              .append(csv(str(r[5]))).append(',')
              .append(r[6]).append('\n');
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String csvClientes(Integer orgId, String q) {
        boolean hasLike = q != null && !q.trim().isEmpty();
        String like = hasLike ? "%" + q.trim() + "%" : null;

        String likeClause = hasLike
            ? "AND (c.legal_name LIKE :like OR c.email LIKE :like OR c.tax_id LIKE :like) "
            : "";

        Query dq = em.createNativeQuery(
            "SELECT c.legal_name, c.tax_id, c.email, c.phone, " +
            "       (SELECT COUNT(*) FROM contracted_services cs WHERE cs.client_id = c.id), " +
            "       (SELECT COALESCE(SUM(inv.total),0) FROM invoices inv " +
            "        WHERE inv.client_id = c.id AND inv.org_id = :orgId) " +
            "FROM clients c WHERE c.org_id = :orgId " +
            likeClause +
            "ORDER BY c.legal_name")
            .setParameter("orgId", orgId);
        if (hasLike) dq.setParameter("like", like);

        StringBuilder sb = new StringBuilder("Razón Social,RUC/DNI,Email,Teléfono,Servicios,Total Facturado\n");
        for (Object[] r : (List<Object[]>) dq.getResultList()) {
            sb.append(csv(str(r[0]))).append(',')
              .append(csv(str(r[1]))).append(',')
              .append(csv(str(r[2]))).append(',')
              .append(csv(str(r[3]))).append(',')
              .append(toLong(r[4])).append(',')
              .append(toBD(r[5])).append('\n');
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String csvPipeline(Integer orgId, String from, String to, String q) {
        LocalDateTime dtFrom = parseFrom(from);
        LocalDateTime dtTo   = parseTo(to);
        boolean hasLike = q != null && !q.trim().isEmpty();
        String like = hasLike ? "%" + q.trim() + "%" : null;

        String likeClause = hasLike
            ? "AND (d.title LIKE :like OR c.legal_name LIKE :like) "
            : "";

        Query dq = em.createNativeQuery(
            "SELECT d.title, c.legal_name, d.amount, d.stage, d.status, d.created_at " +
            "FROM deal d LEFT JOIN clients c ON c.id = d.client_id " +
            "WHERE d.org_id = :orgId AND d.created_at BETWEEN :from AND :to " +
            likeClause +
            "ORDER BY d.created_at DESC")
            .setParameter("orgId", orgId)
            .setParameter("from",  dtFrom)
            .setParameter("to",    dtTo);
        if (hasLike) dq.setParameter("like", like);

        StringBuilder sb = new StringBuilder("Título,Cliente,Monto,Etapa,Estado,Fecha Creación\n");
        for (Object[] r : (List<Object[]>) dq.getResultList()) {
            sb.append(csv(str(r[0]))).append(',')
              .append(csv(str(r[1]))).append(',')
              .append(toBD(r[2])).append(',')
              .append(csv(str(r[3]))).append(',')
              .append(csv(str(r[4]))).append(',')
              .append(r[5]).append('\n');
        }
        return sb.toString();
    }

    // =========================================================
    // AUDITORÍA
    // =========================================================

    @Override
    public AuditoriaResponse auditoria(Integer orgId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReportAuditLog> pg = auditRepo.findByOrgIdOrderByCreatedAtDesc(orgId, pageable);

        List<AuditoriaRow> content = new ArrayList<>();
        for (ReportAuditLog log : pg.getContent()) {
            AuditoriaRow row = new AuditoriaRow();
            row.id          = log.getId();
            row.reportKey   = log.getReportKey();
            row.filtrosJson = log.getFiltrosJson();
            row.createdAt   = log.getCreatedAt();

            if (log.getUserId() != null) {
                @SuppressWarnings("unchecked")
                List<String> names = em.createNativeQuery(
                    "SELECT username FROM usuarios WHERE id = :uid")
                    .setParameter("uid", log.getUserId())
                    .getResultList();
                row.username = names.isEmpty() ? "—" : names.get(0);
            } else {
                row.username = "—";
            }
            content.add(row);
        }

        AuditoriaResponse resp = new AuditoriaResponse();
        resp.content       = content;
        resp.page          = page;
        resp.size          = size;
        resp.totalElements = pg.getTotalElements();
        resp.totalPages    = pg.getTotalPages();
        return resp;
    }

    @Override
    public void registrarAudit(Integer orgId, Integer userId,
                               String reportKey, String filtrosJson) {
        auditRepo.save(new ReportAuditLog(orgId, userId, reportKey, filtrosJson));
    }

    // =========================================================
    // HELPERS PRIVADOS
    // =========================================================

    /** count() con pares (name, value) como varargs: "orgId", 1, "from", dtFrom ... */
    private long count(String sql, Object... pairs) {
        Query q = em.createNativeQuery(sql);
        for (int i = 0; i < pairs.length; i += 2)
            q.setParameter((String) pairs[i], pairs[i + 1]);
        return toLong(q.getSingleResult());
    }

    private LocalDateTime parseFrom(String from) {
        if (from == null || from.trim().isEmpty())
            return LocalDate.now().withDayOfMonth(1).atStartOfDay();
        try { return LocalDate.parse(from, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay(); }
        catch (Exception e) { return LocalDate.now().withDayOfMonth(1).atStartOfDay(); }
    }

    private LocalDateTime parseTo(String to) {
        if (to == null || to.trim().isEmpty())
            return LocalDate.now().atTime(LocalTime.MAX);
        try { return LocalDate.parse(to, DateTimeFormatter.ISO_LOCAL_DATE).atTime(LocalTime.MAX); }
        catch (Exception e) { return LocalDate.now().atTime(LocalTime.MAX); }
    }

    private static BigDecimal toBD(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal) return (BigDecimal) o;
        if (o instanceof Number)     return BigDecimal.valueOf(((Number) o).doubleValue());
        try { return new BigDecimal(String.valueOf(o)); } catch (Exception e) { return BigDecimal.ZERO; }
    }

    private static long toLong(Object o) {
        if (o == null) return 0L;
        if (o instanceof Long)       return (Long) o;
        if (o instanceof Integer)    return ((Integer) o).longValue();
        if (o instanceof BigDecimal) return ((BigDecimal) o).longValue();
        if (o instanceof Number)     return ((Number) o).longValue();
        try { return Long.parseLong(String.valueOf(o)); } catch (Exception e) { return 0L; }
    }

    private static Integer toInt(Object o) {
        if (o == null) return null;
        if (o instanceof Integer) return (Integer) o;
        if (o instanceof Number)  return ((Number) o).intValue();
        try { return Integer.parseInt(String.valueOf(o)); } catch (Exception e) { return null; }
    }

    private static String str(Object o) { return o != null ? String.valueOf(o) : null; }

    private static LocalDateTime toDateTime(Object o) {
        if (o == null)                          return null;
        if (o instanceof LocalDateTime)         return (LocalDateTime) o;
        if (o instanceof java.sql.Timestamp)    return ((java.sql.Timestamp) o).toLocalDateTime();
        if (o instanceof java.sql.Date)         return ((java.sql.Date) o).toLocalDate().atStartOfDay();
        return null;
    }

    private static String csv(String s) {
        if (s == null) return "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n"))
            return "\"" + s.replace("\"", "\"\"") + "\"";
        return s;
    }
}
