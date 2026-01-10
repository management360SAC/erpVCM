package com.vcm.crm.controller;

import com.vcm.crm.dto.LeadDtos;
import com.vcm.crm.dto.LeadStats;
import com.vcm.crm.service.LeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;

    // =============== ENDPOINT PÚBLICO (FORMULARIOS / WEBHOOK) ===============

    /**
     * Endpoint público para recibir envíos de formularios externos:
     *   POST /api/leads/public/{formSlug}
     * Header opcional: X-Webhook-Secret: <tu secreto>
     */
    @PostMapping("/public/{formSlug}")
    @ResponseStatus(HttpStatus.CREATED)
    public LeadDtos.LeadDto publicCreate(
            @PathVariable String formSlug,
            @RequestBody LeadDtos.LeadPublicCreateRequest body,
            @RequestHeader(value = "X-Webhook-Secret", required = false) String secret
    ) {
        leadService.validateSecret(secret);
        return leadService.createPublic(formSlug, body);
    }

    // =============== ENDPOINTS PRIVADOS PARA EL CRM ===============

    /** Crear lead manual desde el CRM */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeadDtos.LeadDto createFromCrm(@RequestBody LeadDtos.LeadCreateRequest body) {
        return leadService.createFromCrm(body);
    }

    /** Editar lead desde el CRM */
    @PutMapping("/{id}")
    public LeadDtos.LeadDto updateFromCrm(
            @PathVariable Integer id,
            @RequestBody LeadDtos.LeadUpdateRequest body
    ) {
        return leadService.updateFromCrm(id, body);
    }

    /** Cambiar solo el estado del lead */
    @PutMapping("/{id}/status")
    public LeadDtos.LeadDto updateStatus(
            @PathVariable Integer id,
            @RequestBody LeadDtos.LeadStatusUpdateRequest body
    ) {
        return leadService.updateStatus(id, body.getStatus());
    }

    /** Estadísticas de leads por rango de fechas */
    @GetMapping("/stats")
    public LeadStats getStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String ownerUsername
    ) {
        return leadService.getStats(from, to, ownerUsername);
    }

    /** Listado con filtros para la tabla de Leads */
    @GetMapping
    public Page<LeadDtos.LeadDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer formId,
            @RequestParam(required = false) String sourceCode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q
    ) {
        return leadService.list(formId, sourceCode, status, q, page, size);
    }
}
