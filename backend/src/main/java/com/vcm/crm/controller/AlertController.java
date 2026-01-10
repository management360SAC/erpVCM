package com.vcm.crm.controller;

import com.vcm.crm.entity.Alert;
import com.vcm.crm.service.AlertService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/alerts-reminders")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    // =====================================================
    //          LISTADO GENERAL CON FILTROS
    //  GET /api/alerts-reminders/alerts?activo=&leido=&userId=
    // =====================================================
    @GetMapping("/alerts")
    public Page<Alert> list(
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) Boolean leido,
            @RequestParam(required = false) Integer userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return alertService.listAlerts(activo, leido, userId, pageable);
    }

    // =====================================================
    //            SOLO NO LEÍDAS
    //  GET /api/alerts-reminders/alerts/unread
    // =====================================================
    @GetMapping("/alerts/unread")
    public Page<Alert> listUnread(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return alertService.listUnread(pageable);
    }

    // =====================================================
    //            ALERTAS POR USUARIO
    //  GET /api/alerts-reminders/alerts/user/{userId}
    // =====================================================
    @GetMapping("/alerts/user/{userId}")
    public Page<Alert> listByUser(
            @PathVariable Integer userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return alertService.listUserAlerts(userId, pageable);
    }

    // =====================================================
    //              DETALLE DE UNA ALERTA
    //  GET /api/alerts-reminders/alerts/{id}
    // =====================================================
    @GetMapping("/alerts/{id}")
    public Alert getById(@PathVariable Long id) {
        return alertService.getById(id);
    }

    // =====================================================
    //                  CREAR ALERTA
    //  POST /api/alerts-reminders/alerts
    // =====================================================
    @PostMapping("/alerts")
    public ResponseEntity<Alert> create(@RequestBody Alert alert) {
        Alert created = alertService.create(alert);
        return ResponseEntity.ok(created);
    }

    // =====================================================
    //                  ACTUALIZAR ALERTA
    //  PUT /api/alerts-reminders/alerts/{id}
    // =====================================================
    @PutMapping("/alerts/{id}")
    public ResponseEntity<Alert> update(
            @PathVariable Long id,
            @RequestBody Alert alert
    ) {
        Alert updated = alertService.update(id, alert);
        return ResponseEntity.ok(updated);
    }

    // =====================================================
    //              MARCAR COMO LEÍDA
    //  PUT /api/alerts-reminders/alerts/{id}/read
    // =====================================================
    @PutMapping("/alerts/{id}/read")
    public ResponseEntity<Alert> markAsRead(@PathVariable Long id) {
        Alert updated = alertService.markAsRead(id);
        return ResponseEntity.ok(updated);
    }

    // =====================================================
    //                  ELIMINAR ALERTA
    //  DELETE /api/alerts-reminders/alerts/{id}
    // =====================================================
    @DeleteMapping("/alerts/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        alertService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // =====================================================
    //          ALERTAS PENDIENTES (para scheduler / UI)
    //  GET /api/alerts-reminders/alerts/pending
    //  opcional: ?now=2025-11-24T10:00:00
    // =====================================================
    @GetMapping("/alerts/pending")
    public Page<Alert> pending(
            @RequestParam(required = false) String now,
            @PageableDefault(size = 20, sort = "proximaEjecucion", direction = Sort.Direction.ASC)
            Pageable pageable
    ) {
        LocalDateTime nowTime;
        if (now != null) {
            nowTime = LocalDateTime.parse(now);
        } else {
            nowTime = LocalDateTime.now(ZoneId.of("America/Lima"));
        }
        return alertService.findPending(nowTime, pageable);
    }

    // =====================================================
    //          CONTADOR DE PENDIENTES POR USUARIO
    //  GET /api/alerts-reminders/alerts/pending/count?userId=1
    // =====================================================
    @GetMapping("/alerts/pending/count")
    public long countPendingByUser(
            @RequestParam Integer userId,
            @RequestParam(required = false) String now
    ) {
        LocalDateTime nowTime =
                (now != null) ? LocalDateTime.parse(now) : LocalDateTime.now(ZoneId.of("America/Lima"));
        return alertService.countPendingByUser(userId, nowTime);
    }
}
