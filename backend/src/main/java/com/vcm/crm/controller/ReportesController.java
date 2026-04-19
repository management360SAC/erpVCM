package com.vcm.crm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vcm.crm.dto.ReportDtos.*;
import com.vcm.crm.entity.Usuario;
import com.vcm.crm.repository.UsuarioRepository;
import com.vcm.crm.service.ReportesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReportesController {

    private final ReportesService    reportesService;
    private final UsuarioRepository  usuarioRepo;
    private final ObjectMapper       mapper = new ObjectMapper();

    private Usuario currentUser(UserDetails ud) {
        if (ud == null) return null;
        return usuarioRepo.findByUsername(ud.getUsername()).orElse(null);
    }

    private Integer orgId(UserDetails ud) {
        Usuario u = currentUser(ud);
        return u != null ? u.getOrgId() : 1;
    }

    private Integer userId(UserDetails ud) {
        Usuario u = currentUser(ud);
        return u != null ? u.getId() : null;
    }

    // DASHBOARD
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','USER','MANAGER','OPERADOR')")
    public ResponseEntity<DashboardKpis> dashboard(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        Integer oid = orgId(ud);
        DashboardKpis kpis = reportesService.dashboard(oid, from, to);
        Map<String, String> f = new HashMap<>();
        f.put("from", nvl(from)); f.put("to", nvl(to));
        registrar(ud, oid, "dashboard", f);
        return ResponseEntity.ok(kpis);
    }

    // PAGOS
    @GetMapping("/pagos")
    @PreAuthorize("hasAnyRole('ADMIN','USER','MANAGER','OPERADOR')")
    public ResponseEntity<PagosResponse> pagos(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false)    String from,
            @RequestParam(required = false)    String to,
            @RequestParam(required = false)    String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        size = Math.min(size, 100);
        Integer oid = orgId(ud);
        PagosResponse resp = reportesService.pagos(oid, from, to, q, page, size);
        Map<String, String> f = new HashMap<>();
        f.put("from", nvl(from)); f.put("to", nvl(to)); f.put("q", nvl(q));
        registrar(ud, oid, "pagos", f);
        return ResponseEntity.ok(resp);
    }

    // CLIENTES
    @GetMapping("/clientes")
    @PreAuthorize("hasAnyRole('ADMIN','USER','MANAGER','OPERADOR')")
    public ResponseEntity<ClientesResponse> clientes(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false)    String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        size = Math.min(size, 100);
        Integer oid = orgId(ud);
        ClientesResponse resp = reportesService.clientes(oid, q, page, size);
        Map<String, String> f = new HashMap<>();
        f.put("q", nvl(q));
        registrar(ud, oid, "clientes", f);
        return ResponseEntity.ok(resp);
    }

    // PIPELINE
    @GetMapping("/pipeline")
    @PreAuthorize("hasAnyRole('ADMIN','USER','MANAGER','OPERADOR')")
    public ResponseEntity<PipelineResponse> pipeline(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false)    String from,
            @RequestParam(required = false)    String to,
            @RequestParam(required = false)    String stage,
            @RequestParam(required = false)    String status,
            @RequestParam(required = false)    String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        size = Math.min(size, 100);
        Integer oid = orgId(ud);
        PipelineResponse resp = reportesService.pipeline(oid, from, to, stage, status, q, page, size);
        Map<String, String> f = new HashMap<>();
        f.put("from", nvl(from)); f.put("to", nvl(to)); f.put("q", nvl(q));
        registrar(ud, oid, "pipeline", f);
        return ResponseEntity.ok(resp);
    }

    // EXPORT CSV
    @GetMapping("/export/{key}")
    @PreAuthorize("hasAnyRole('ADMIN','USER','MANAGER','OPERADOR')")
    public ResponseEntity<byte[]> export(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable                   String key,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String extra) {

        Integer oid = orgId(ud);
        String csv = reportesService.exportCsv(oid, key, from, to, q, extra);
        Map<String, String> f = new HashMap<>();
        f.put("from", nvl(from)); f.put("to", nvl(to));
        registrar(ud, oid, "export_" + key, f);

        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDisposition(
            ContentDisposition.builder("attachment")
                .filename("reporte_" + key + ".csv")
                .build());
        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    // AUDITORÍA (solo ADMIN)
    @GetMapping("/auditoria")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuditoriaResponse> auditoria(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        size = Math.min(size, 100);
        Integer oid = orgId(ud);
        return ResponseEntity.ok(reportesService.auditoria(oid, page, size));
    }

    private void registrar(UserDetails ud, Integer oid, String key, Map<String, String> filtros) {
        try {
            Integer uid = userId(ud);
            String json = mapper.writeValueAsString(filtros);
            reportesService.registrarAudit(oid, uid, key, json);
        } catch (Exception ignored) {}
    }

    private static String nvl(String s) { return s != null ? s : ""; }
}
