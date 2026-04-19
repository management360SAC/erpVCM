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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/proyecciones")
@RequiredArgsConstructor
public class ManualProjectionController {

    private final ManualProjectionRepository repo;
    private final UsuarioRepository usuarioRepo;

    private Integer orgId(UserDetails ud) {
        if (ud == null) return 1;
        return usuarioRepo.findByUsername(ud.getUsername()).map(Usuario::getOrgId).orElse(1);
    }

    private Long userId(UserDetails ud) {
        if (ud == null) return 1L;
        return usuarioRepo.findByUsername(ud.getUsername())
                .map(u -> u.getId() != null ? u.getId().longValue() : 1L)
                .orElse(1L);
    }

    // GET /api/proyecciones?year=2026
    @GetMapping
    public List<ManualProjection> list(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) Integer year) {
        int y = year != null ? year : LocalDate.now().getYear();
        return repo.findByOrgIdAndYearOrderByMonthAsc(orgId(ud), y);
    }

    // POST /api/proyecciones  — upsert by (orgId, year, month)
    @PostMapping
    public ResponseEntity<?> upsert(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody Map<String, Object> body) {
        Integer oid   = orgId(ud);
        Integer year  = toInt(body.get("year"),  LocalDate.now().getYear());
        Integer month = body.containsKey("month") && body.get("month") != null
                        ? toInt(body.get("month"), null) : null;
        BigDecimal amount = new BigDecimal(String.valueOf(body.get("amount")));

        ManualProjection mp = repo.findByOrgIdAndYearAndMonth(oid, year, month)
                .orElse(new ManualProjection());
        mp.setOrgId(oid);
        mp.setYear(year);
        mp.setMonth(month);
        mp.setAmount(amount);
        mp.setCreatedBy(userId(ud));
        return ResponseEntity.ok(repo.save(mp));
    }

    // DELETE /api/proyecciones/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static Integer toInt(Object o, Integer def) {
        if (o == null) return def;
        if (o instanceof Integer) return (Integer) o;
        try { return Integer.parseInt(String.valueOf(o)); } catch (Exception e) { return def; }
    }
}
