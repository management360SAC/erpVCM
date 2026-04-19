package com.vcm.crm.controller;

import com.vcm.crm.dto.DealResponse;
import com.vcm.crm.entity.Deal;
import com.vcm.crm.entity.Usuario;
import com.vcm.crm.repository.DealRepository;
import com.vcm.crm.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/deals")
public class DealController {

    private final DealRepository dealRepo;
    private final UsuarioRepository usuarioRepo;

    public DealController(DealRepository dealRepo, UsuarioRepository usuarioRepo) {
        this.dealRepo = dealRepo;
        this.usuarioRepo = usuarioRepo;
    }

    /** GET /api/deals/board — retorna { deals: [...] } */
    @GetMapping("/board")
    public ResponseEntity<Map<String, List<DealResponse>>> getBoard() {
        int orgId = 1;
        List<Deal> deals = dealRepo.findByOrgId(orgId);

        List<DealResponse> result = deals.stream().map(d -> {
            DealResponse r = new DealResponse();
            r.id = d.getId();
            r.title = d.getTitle();
            r.amount = d.getAmount();
            r.stage = d.getStage();
            r.status = d.getStatus();
            r.createdAt = d.getCreatedAt();

            // clientName: primero Client, si no MarketingLead
            if (d.getClient() != null) {
                r.clientName = d.getClient().getLegalName();
            } else if (d.getLead() != null) {
                r.clientName = d.getLead().getCompanyName() != null
                    ? d.getLead().getCompanyName()
                    : d.getLead().getName();
            }

            // ownerName: buscar usuario por ownerUserId
            if (d.getOwnerUserId() != null) {
                Optional<Usuario> owner = usuarioRepo.findById(d.getOwnerUserId().intValue());
                r.ownerName = owner.map(u -> u.getNombre() != null ? u.getNombre() : u.getUsername()).orElse(null);
            }

            return r;
        }).collect(Collectors.toList());

        Map<String, List<DealResponse>> resp = new HashMap<>();
        resp.put("deals", result);
        return ResponseEntity.ok(resp);
    }

    /** PUT /api/deals/{id}/stage — actualiza la etapa de un deal */
    @PutMapping("/{id}/stage")
    public ResponseEntity<?> updateStage(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String stage = body.get("stage");
        if (stage == null || stage.trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "El campo 'stage' es requerido");
            return ResponseEntity.badRequest().body(err);
        }

        Deal deal = dealRepo.findById(id).orElse(null);
        if (deal == null) {
            return ResponseEntity.notFound().build();
        }

        deal.setStage(stage);

        if ("CERRADO_GANADO".equals(stage)) {
            deal.setStatus("WON");
        } else if ("CERRADO_PERDIDO".equals(stage)) {
            deal.setStatus("LOST");
        } else {
            deal.setStatus("OPEN");
        }

        dealRepo.save(deal);

        DealResponse r = new DealResponse();
        r.id = deal.getId();
        r.title = deal.getTitle();
        r.amount = deal.getAmount();
        r.stage = deal.getStage();
        r.status = deal.getStatus();
        r.createdAt = deal.getCreatedAt();

        return ResponseEntity.ok(r);
    }
}
