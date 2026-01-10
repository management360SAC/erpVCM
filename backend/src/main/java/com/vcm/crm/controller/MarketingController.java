// src/main/java/com/vcm/crm/controller/MarketingController.java
package com.vcm.crm.controller;

import com.vcm.crm.dto.MarketingDtos;
import com.vcm.crm.service.MarketingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/marketing")
public class MarketingController {

    private final MarketingService marketingService;

    public MarketingController(MarketingService marketingService) {
        this.marketingService = marketingService;
    }

    @PostMapping("/intake")
    public ResponseEntity<MarketingDtos.IntakeLeadResponse> intakeLead(
            @RequestBody MarketingDtos.IntakeLeadRequest req
    ) {
        MarketingDtos.IntakeLeadResponse res = marketingService.intakeLead(req);
        return ResponseEntity.ok(res);
    }
}
