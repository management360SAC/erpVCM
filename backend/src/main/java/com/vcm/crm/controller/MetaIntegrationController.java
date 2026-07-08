package com.vcm.crm.controller;

import com.vcm.crm.dto.MetaIntegrationDtos.MetaConnectRequest;
import com.vcm.crm.dto.MetaIntegrationDtos.MetaStatusResponse;
import com.vcm.crm.service.MetaIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/integrations/meta")
@RequiredArgsConstructor
public class MetaIntegrationController {

    private final MetaIntegrationService service;

    private static final Integer DEFAULT_ORG = 1;

    @GetMapping
    public ResponseEntity<MetaStatusResponse> getStatus() {
        return ResponseEntity.ok(service.getStatus(DEFAULT_ORG));
    }

    @PostMapping("/connect")
    public ResponseEntity<MetaStatusResponse> connect(@RequestBody MetaConnectRequest req) {
        return ResponseEntity.ok(service.connect(DEFAULT_ORG, req));
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<Void> disconnect() {
        service.disconnect(DEFAULT_ORG);
        return ResponseEntity.noContent().build();
    }
}
