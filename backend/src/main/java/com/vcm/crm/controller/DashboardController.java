package com.vcm.crm.controller;

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
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final EntityManager em;
    private final UsuarioRepository usuarioRepo;
    private final ManualProjectionRepository projRepo;

    private Integer orgId(UserDetails ud) {
        if (ud == null) return 1;
        return usuarioRepo.findByUsername(ud.getUsername()).map(Usuario::getOrgId).orElse(1);
    }

    // GET /api/dashboard/summary
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary(@AuthenticationPrincipal UserDetails ud) {
        Integer oid = orgId(ud);
        LocalDate now   = LocalDate.now();
        int year  = now.getYear();
        int month = now.getMonthValue();

        // Clientes registrados
        long totalClientes = scalarLong(
            "SELECT COUNT(*) FROM clients WHERE org_id=?1", oid);

        // Servicios activos (en ejecución)
        long serviciosActivos = scalarLong(
            "SELECT COUNT(*) FROM contracted_services WHERE org_id=?1 AND status='EN_EJECUCION'", oid);

        // MRR real: pagos VÁLIDOS del mes actual
        BigDecimal mrrReal = scalar(
            "SELECT COALESCE(SUM(p.amount),0) " +
            "FROM payments p INNER JOIN invoices i ON i.id = p.invoice_id " +
            "WHERE i.org_id=?1 AND p.status='VALIDO' " +
            "  AND YEAR(p.paid_at)=?2 AND MONTH(p.paid_at)=?3",
            oid, year, month);

        // Pendiente de cobro
        BigDecimal pendienteCobro = scalar(
            "SELECT COALESCE(SUM(i.total - COALESCE(paid.amt,0)),0) " +
            "FROM invoices i " +
            "LEFT JOIN (SELECT invoice_id, SUM(amount) amt FROM payments WHERE status='VALIDO' GROUP BY invoice_id) paid " +
            "  ON paid.invoice_id = i.id " +
            "WHERE i.org_id=?1 AND i.status IN ('EMITIDA','PAGADA_PARCIAL')", oid);

        // Valor total de facturación del mes (todas las facturas del mes)
        BigDecimal totalFacturadoMes = scalar(
            "SELECT COALESCE(SUM(total),0) FROM invoices WHERE org_id=?1 " +
            "AND YEAR(issue_date)=?2 AND MONTH(issue_date)=?3", oid, year, month);

        // Pipeline abierto
        BigDecimal pipelineValue = scalar(
            "SELECT COALESCE(SUM(amount),0) FROM deal WHERE org_id=?1 AND status='OPEN'", oid);

        // Leads últimos 30 días
        long totalLeads30d = scalarLong(
            "SELECT COUNT(*) FROM marketing_lead WHERE org_id=?1 " +
            "AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", oid);

        // Tasa de cierre (últimos 90 días)
        long won  = scalarLong("SELECT COUNT(*) FROM deal WHERE org_id=?1 AND status='WON' " +
                               "AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)", oid);
        long lost = scalarLong("SELECT COUNT(*) FROM deal WHERE org_id=?1 AND status='LOST' " +
                               "AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)", oid);
        double convRate = (won + lost) > 0 ? (double) won / (won + lost) * 100 : 0;

        // Proyección mensual: primero busca manual, sino promedio histórico
        boolean hasManual = projRepo.findByOrgIdAndYearAndMonth(oid, year, month).isPresent();
        BigDecimal mrrProjected = projRepo.findByOrgIdAndYearAndMonth(oid, year, month)
                .map(mp -> mp.getAmount())
                .orElseGet(() ->
                    projRepo.findByOrgIdAndYearAndMonth(oid, year, null)
                        .map(mp -> mp.getAmount().divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP))
                        .orElseGet(() -> {
                            // Fallback: promedio de los últimos 3 meses
                            BigDecimal avg = scalar(
                                "SELECT COALESCE(AVG(monthly.total),0) FROM (" +
                                "  SELECT YEAR(p.paid_at) y, MONTH(p.paid_at) m, SUM(p.amount) total " +
                                "  FROM payments p INNER JOIN invoices i ON i.id=p.invoice_id " +
                                "  WHERE i.org_id=?1 AND p.status='VALIDO' " +
                                "    AND p.paid_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) " +
                                "  GROUP BY YEAR(p.paid_at), MONTH(p.paid_at)" +
                                ") monthly", oid);
                            return avg;
                        })
                );

        double pctCumplimiento = mrrProjected.compareTo(BigDecimal.ZERO) > 0
                ? round2(mrrReal.doubleValue() / mrrProjected.doubleValue() * 100)
                : 0;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("year",               year);
        res.put("month",              month);
        res.put("totalClientes",      totalClientes);
        res.put("serviciosActivos",   serviciosActivos);
        res.put("mrrReal",            mrrReal.doubleValue());
        res.put("mrrProjected",       mrrProjected.doubleValue());
        res.put("pctCumplimiento",    pctCumplimiento);
        res.put("pendienteCobro",     pendienteCobro.doubleValue());
        res.put("totalFacturadoMes",  totalFacturadoMes.doubleValue());
        res.put("pipelineValue",      pipelineValue.doubleValue());
        res.put("totalLeads30d",      totalLeads30d);
        res.put("tasaCierre",         round2(convRate));
        res.put("hasManualProjection", hasManual);
        return ResponseEntity.ok(res);
    }

    private BigDecimal scalar(String sql, Object... params) {
        javax.persistence.Query q = em.createNativeQuery(sql);
        for (int i = 0; i < params.length; i++) q.setParameter(i + 1, params[i]);
        return toBD(q.getSingleResult());
    }

    private long scalarLong(String sql, Object... params) {
        return scalar(sql, params).longValue();
    }

    private static BigDecimal toBD(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal) return (BigDecimal) o;
        if (o instanceof Number)     return BigDecimal.valueOf(((Number) o).doubleValue());
        try { return new BigDecimal(String.valueOf(o)); } catch (Exception e) { return BigDecimal.ZERO; }
    }

    private static double round2(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
