// src/main/java/com/vcm/crm/controller/ContractedServiceController.java
package com.vcm.crm.controller;

import com.vcm.crm.dto.ContractedServiceDTO;
import com.vcm.crm.dto.CreateContractedServiceRequest;
import com.vcm.crm.entity.ContractedService.ServiceStatus;
import com.vcm.crm.service.ContractedServiceService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(
    origins = {"http://localhost:5173","http://127.0.0.1:5173"},
    allowedHeaders = {"Authorization","Content-Type","X-Org-Id","X-User-Id"},
    exposedHeaders = {"Authorization"},
    allowCredentials = "true"
)
@RestController
@RequestMapping("/api/contracted-services")
public class ContractedServiceController {

    @Autowired
    private ContractedServiceService service;

    // ========= LISTAR =========
    @GetMapping
    public Page<ContractedServiceDTO> list(
            @RequestParam(required = false) Long orgId,
            @RequestHeader(name = "X-Org-Id", required = false) Long orgHeaderId,
            @RequestParam(required = false) ServiceStatus status,
            @RequestParam(required = false, name = "q") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long effectiveOrgId = (orgHeaderId != null) ? orgHeaderId : orgId;
        if (effectiveOrgId == null) {
            throw new IllegalArgumentException("orgId requerido (header X-Org-Id o query param orgId).");
        }
        return service.listContractedServices(effectiveOrgId, status, q, PageRequest.of(page, size));
    }

    // ========= DETALLE =========
    @GetMapping("/{id}")
    public ContractedServiceDTO getById(@PathVariable Long id) {
        return service.getById(id);
    }

    // ========= CREAR =========
    @PostMapping
    public ResponseEntity<ContractedServiceDTO> create(
            @RequestBody CreateContractedServiceRequest req,
            @RequestHeader("X-Org-Id") Long orgId,
            @RequestHeader("X-User-Id") Long userId
    ) {
        return ResponseEntity.ok(service.createContractedService(req, orgId, userId));
    }

    // ========= ACTUALIZAR =========
    @PutMapping("/{id}")
    public ResponseEntity<ContractedServiceDTO> update(
            @PathVariable Long id,
            @RequestBody CreateContractedServiceRequest req
    ) {
        return ResponseEntity.ok(service.updateContractedService(id, req));
    }

    // ========= CAMBIAR ESTADO DE EJECUCIÓN =========
    // Recibe body JSON: { "status": "EN_EJECUCION", "endDate": "2025-12-31" }
    @PatchMapping("/{id}/status")
    public ContractedServiceDTO updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.trim().isEmpty()) {
            throw new IllegalArgumentException("status es requerido");
        }

        ServiceStatus status = ServiceStatus.valueOf(statusStr);

        LocalDate endDate = null;
        String endDateStr = body.get("endDate");
        if (endDateStr != null && !endDateStr.trim().isEmpty()) {
            endDate = LocalDate.parse(endDateStr); // formato ISO: 2025-11-30
        }

        return service.updateStatus(id, status, endDate);
    }

    // ========= RECOMPUTE =========
    @PatchMapping("/{id}/recompute")
    public ResponseEntity<?> recompute(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.recomputeStates(id));
        } catch (Exception ex) {
            HashMap<String,String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // ========= COMPLETE =========
    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.completeIfPossible(id));
        } catch (IllegalStateException ex) {
            HashMap<String,String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // ========= ELIMINAR =========
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteContractedService(id);
        return ResponseEntity.noContent().build();
    }
}
