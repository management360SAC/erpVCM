package com.vcm.crm.controller;

import com.vcm.crm.entity.ManualProjection;
import com.vcm.crm.entity.Usuario;
import com.vcm.crm.repository.ManualProjectionRepository;
import com.vcm.crm.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.persistence.EntityManager;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final EntityManager              em;
    private final UsuarioRepository          usuarioRepo;
    private final ManualProjectionRepository projRepo;

    // ─────────────────────────────────────────────────────────────────
    //  Helper: org_id del usuario autenticado
    // ─────────────────────────────────────────────────────────────────
    private Integer orgId(UserDetails ud) {
        if (ud == null) return 1;
        return usuarioRepo.findByUsername(ud.getUsername())
                .map(Usuario::getOrgId)
                .orElse(1);
    }

    // ─────────────────────────────────────────────────────────────────
    //  GET /api/analytics/kpis
    //  Responde: { summary, leadsSeries, revenueSeries }
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> kpis(
            @AuthenticationPrincipal UserDetails ud) {

        Integer oid = orgId(ud);

        // — totalLeads (últimos 30 días) desde marketing_lead
        long totalLeads = count(
            "SELECT COUNT(*) FROM marketing_lead " +
            "WHERE org_id = ?1 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", oid);

        // — pipeline value (deals OPEN)
        BigDecimal pipelineValue = scalar(
            "SELECT COALESCE(SUM(amount),0) FROM deal WHERE org_id = ?1 AND status='OPEN'", oid);

        // — tasa conversión: deals WON / (WON + LOST), últimos 90 días
        long won  = count("SELECT COUNT(*) FROM deal WHERE org_id=?1 AND status='WON' " +
                          "AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)", oid);
        long lost = count("SELECT COUNT(*) FROM deal WHERE org_id=?1 AND status='LOST' " +
                          "AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)", oid);
        double convRate = (won + lost) > 0 ? (double) won / (won + lost) : 0.0;

        // — MRR: suma pagos del mes actual
        BigDecimal mrr = scalar(
            "SELECT COALESCE(SUM(p.amount),0) " +
            "FROM payments p INNER JOIN invoices i ON i.id = p.invoice_id " +
            "WHERE i.org_id = ?1 " +
            "  AND YEAR(p.paid_at)  = YEAR(CURDATE()) " +
            "  AND MONTH(p.paid_at) = MONTH(CURDATE())", oid);

        // — churnRate: clientes sin actividad en 90 días / total clientes
        long totalClientes  = count("SELECT COUNT(*) FROM clients WHERE org_id=?1", oid);
        long clientesActivos= count(
            "SELECT COUNT(DISTINCT cs.client_id) FROM contracted_services cs " +
            "WHERE cs.org_id=?1 AND cs.status='EN_EJECUCION'", oid);
        double churnRate = totalClientes > 0
            ? Math.max(0, (double)(totalClientes - clientesActivos) / totalClientes)
            : 0.0;

        // — leadsSeries: leads por mes (últimos 12 meses)
        @SuppressWarnings("unchecked")
        List<Object[]> lsRows = em.createNativeQuery(
            "SELECT DATE_FORMAT(created_at,'%Y-%m') AS mes, COUNT(*) " +
            "FROM marketing_lead WHERE org_id=?1 " +
            "  AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) " +
            "GROUP BY mes ORDER BY mes")
            .setParameter(1, oid).getResultList();
        List<Map<String, Object>> leadsSeries = new ArrayList<>();
        for (Object[] r : lsRows) {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("x", r[0]); p.put("value", toLong(r[1]));
            leadsSeries.add(p);
        }

        // — revenueSeries: pagos por mes (últimos 12 meses)
        @SuppressWarnings("unchecked")
        List<Object[]> rsRows = em.createNativeQuery(
            "SELECT DATE_FORMAT(p.paid_at,'%Y-%m') AS mes, COALESCE(SUM(p.amount),0) " +
            "FROM payments p INNER JOIN invoices i ON i.id = p.invoice_id " +
            "WHERE i.org_id=?1 " +
            "  AND p.paid_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) " +
            "GROUP BY mes ORDER BY mes")
            .setParameter(1, oid).getResultList();
        List<Map<String, Object>> revenueSeries = new ArrayList<>();
        for (Object[] r : rsRows) {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("x", r[0]); p.put("value", toBD(r[1]).doubleValue());
            revenueSeries.add(p);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalLeads",    totalLeads);
        summary.put("convRate",      round2(convRate));
        summary.put("pipelineValue", pipelineValue.doubleValue());
        summary.put("mrr",           mrr.doubleValue());
        summary.put("churnRate",     round2(churnRate));

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("summary",       summary);
        resp.put("leadsSeries",   leadsSeries);
        resp.put("revenueSeries", revenueSeries);
        return ResponseEntity.ok(resp);
    }

    // ─────────────────────────────────────────────────────────────────
    //  GET /api/analytics/profitability?q=&status=
    //  Responde: { rows, totalRev, totalCost, totalMargin }
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/profitability")
    public ResponseEntity<Map<String, Object>> profitability(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status) {

        Integer oid  = orgId(ud);
        String  like = (q != null && !q.trim().isEmpty()) ? "%" + q.trim() + "%" : null;

        boolean hasStatus = status != null && !status.trim().isEmpty() && !"TODOS".equals(status);
        boolean hasLike   = like != null;

        StringBuilder sql = new StringBuilder(
            "SELECT cs.id, cs.number, c.legal_name, " +
            "       cs.total AS revenue, " +
            "       cs.status, " +
            "       u.nombre AS owner " +
            "FROM contracted_services cs " +
            "LEFT JOIN clients  c ON c.id = cs.client_id " +
            "LEFT JOIN usuarios u ON u.org_id = cs.org_id AND u.rol = 'ADMIN' " +
            "WHERE cs.org_id = :orgId ");

        if (hasStatus) sql.append("AND cs.status = :status ");
        if (hasLike)   sql.append("AND (cs.number LIKE :like OR c.legal_name LIKE :like) ");
        sql.append("ORDER BY cs.id DESC LIMIT 200");

        @SuppressWarnings("unchecked")
        javax.persistence.Query dq = em.createNativeQuery(sql.toString())
            .setParameter("orgId", oid);
        if (hasStatus) dq.setParameter("status", status);
        if (hasLike)   dq.setParameter("like",   like);

        List<Object[]> rows = dq.getResultList();

        List<Map<String, Object>> content = new ArrayList<>();
        double totalRev = 0, totalCost = 0;

        for (Object[] r : rows) {
            double revenue = toBD(r[3]).doubleValue();
            // Cost = 70 % del revenue (no existe tabla de costos, se asume margen 30 %)
            double cost   = revenue * 0.70;
            double margin = revenue - cost;
            double mPct   = revenue > 0 ? margin / revenue : 0;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id",        toLong(r[0]));
            row.put("project",   str(r[1]));   // número de servicio
            row.put("client",    str(r[2]));
            row.put("revenue",   round2(revenue));
            row.put("cost",      round2(cost));
            row.put("margin",    round2(margin));
            row.put("marginPct", round2(mPct));
            row.put("owner",     str(r[5]));
            row.put("status",    str(r[4]));
            content.add(row);

            totalRev  += revenue;
            totalCost += cost;
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("rows",        content);
        resp.put("totalRev",    round2(totalRev));
        resp.put("totalCost",   round2(totalCost));
        resp.put("totalMargin", round2(totalRev - totalCost));
        return ResponseEntity.ok(resp);
    }

    // ─────────────────────────────────────────────────────────────────
    //  GET /api/analytics/projections?horizon=6
    //  Proyecta ingresos basándose en el promedio de los últimos meses.
    //  Responde: { horizon, series, table, totalBase }
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/projections")
    public ResponseEntity<Map<String, Object>> projections(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(defaultValue = "6") int horizon) {

        Integer oid = orgId(ud);
        horizon = Math.min(Math.max(horizon, 1), 24);

        // Historial de pagos por mes (últimos 12 meses)
        @SuppressWarnings("unchecked")
        List<Object[]> hist = em.createNativeQuery(
            "SELECT DATE_FORMAT(p.paid_at,'%Y-%m') AS mes, COALESCE(SUM(p.amount),0) " +
            "FROM payments p INNER JOIN invoices i ON i.id = p.invoice_id " +
            "WHERE i.org_id=?1 AND p.status='VALIDO' " +
            "  AND p.paid_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) " +
            "GROUP BY mes ORDER BY mes")
            .setParameter(1, oid).getResultList();

        // Historial real (meses ya pasados) para comparación
        Map<String, Double> realByMonth = new LinkedHashMap<>();
        for (Object[] r : hist) realByMonth.put(str(r[0]), toBD(r[1]).doubleValue());

        // Proyecciones manuales del año actual y siguiente
        int currentYear = LocalDate.now().getYear();
        Map<String, Double> manualByMonth = new LinkedHashMap<>();
        List<ManualProjection> manuals = projRepo.findByOrgIdAndYearOrderByMonthAsc(oid, currentYear);
        manuals.addAll(projRepo.findByOrgIdAndYearOrderByMonthAsc(oid, currentYear + 1));
        for (ManualProjection mp : manuals) {
            if (mp.getMonth() != null) {
                String key = String.format("%d-%02d", mp.getYear(), mp.getMonth());
                manualByMonth.put(key, mp.getAmount().doubleValue());
            }
        }

        // Promedio mensual histórico
        double avg = hist.isEmpty() ? 0
            : hist.stream().mapToDouble(r -> toBD(r[1]).doubleValue()).average().orElse(0);

        // Tendencia
        double trend = 0;
        if (hist.size() >= 4) {
            int half = hist.size() / 2;
            double first = hist.subList(0, half).stream()
                .mapToDouble(r -> toBD(r[1]).doubleValue()).average().orElse(0);
            double second = hist.subList(half, hist.size()).stream()
                .mapToDouble(r -> toBD(r[1]).doubleValue()).average().orElse(0);
            trend = (second - first) / hist.size();
        }

        // Construir series proyectadas
        List<Map<String, Object>> series = new ArrayList<>();
        List<Map<String, Object>> table  = new ArrayList<>();
        double totalBase = 0;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        LocalDate next = LocalDate.now().plusMonths(1).withDayOfMonth(1);

        for (int i = 0; i < horizon; i++) {
            String label = next.plusMonths(i).format(fmt);
            double autoBase  = Math.max(0, avg + trend * i);
            // Si hay proyección manual para este mes, usarla como base
            double base      = manualByMonth.containsKey(label) ? manualByMonth.get(label) : autoBase;
            double optimista = base * 1.15;
            double pesimista = base * 0.85;
            Double real      = realByMonth.get(label); // null si el mes aún no ha pasado
            boolean hasManual = manualByMonth.containsKey(label);

            Map<String, Object> sp = new LinkedHashMap<>();
            sp.put("x",         label);
            sp.put("base",      round2(base));
            sp.put("optimista", round2(optimista));
            sp.put("pesimista", round2(pesimista));
            if (real != null) sp.put("real", round2(real));
            series.add(sp);

            Map<String, Object> tr = new LinkedHashMap<>();
            tr.put("month",     label);
            tr.put("base",      round2(base));
            tr.put("optimista", round2(optimista));
            tr.put("pesimista", round2(pesimista));
            tr.put("hasManual", hasManual);
            if (real != null) {
                tr.put("real",          round2(real));
                tr.put("diferencia",    round2(real - base));
                tr.put("pctCumplimiento", base > 0 ? round2(real / base * 100) : 0);
            }
            table.add(tr);

            totalBase += base;
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("horizon",   horizon);
        resp.put("series",    series);
        resp.put("table",     table);
        resp.put("totalBase", round2(totalBase));
        return ResponseEntity.ok(resp);
    }

    // ─────────────────────────────────────────────────────────────────
    //  Utilidades
    // ─────────────────────────────────────────────────────────────────

    private long count(String sql, Object... params) {
        javax.persistence.Query q = em.createNativeQuery(sql);
        for (int i = 0; i < params.length; i++) q.setParameter(i + 1, params[i]);
        Object r = q.getSingleResult();
        return toLong(r);
    }

    private BigDecimal scalar(String sql, Object... params) {
        javax.persistence.Query q = em.createNativeQuery(sql);
        for (int i = 0; i < params.length; i++) q.setParameter(i + 1, params[i]);
        return toBD(q.getSingleResult());
    }

    private static long toLong(Object o) {
        if (o == null) return 0L;
        if (o instanceof Long)       return (Long) o;
        if (o instanceof Integer)    return ((Integer) o).longValue();
        if (o instanceof BigDecimal) return ((BigDecimal) o).longValue();
        if (o instanceof Number)     return ((Number) o).longValue();
        try { return Long.parseLong(String.valueOf(o)); } catch (Exception e) { return 0L; }
    }

    private static BigDecimal toBD(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal) return (BigDecimal) o;
        if (o instanceof Number)     return BigDecimal.valueOf(((Number) o).doubleValue());
        try { return new BigDecimal(String.valueOf(o)); } catch (Exception e) { return BigDecimal.ZERO; }
    }

    private static String str(Object o) { return o != null ? String.valueOf(o) : null; }

    private static double round2(double v) {
        return BigDecimal.valueOf(v).setScale(4, RoundingMode.HALF_UP).doubleValue();
    }
}
