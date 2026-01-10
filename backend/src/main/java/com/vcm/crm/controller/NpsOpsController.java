package com.vcm.crm.controller;

import com.vcm.crm.dto.NpsDtos;
import com.vcm.crm.service.NpsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ops/nps") 
@RequiredArgsConstructor
public class NpsOpsController {

    private final NpsService npsService;

    @PostMapping("/summary")
    public ResponseEntity<NpsDtos.NpsSummaryDto> getSummary(
            @RequestBody NpsDtos.NpsRequest request
    ) {
        NpsDtos.NpsSummaryDto summary = npsService.getSummary(request);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/responses")
    public ResponseEntity<Page<NpsDtos.NpsResponseDto>> getResponses(
            @RequestBody NpsDtos.NpsRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<NpsDtos.NpsResponseDto> responses = npsService.getResponses(request, page, size);
        return ResponseEntity.ok(responses);
    }
}