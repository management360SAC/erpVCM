package com.vcm.crm.controller;

import com.vcm.crm.dto.AiDtos;
import com.vcm.crm.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@Valid @RequestBody AiDtos.AiChatRequest req) {
        try {
            String reply = aiService.chat(req.getMessage(), req.getContextType());
            return ResponseEntity.ok(new AiDtos.AiChatResponse(reply));
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Error al procesar la consulta: " + e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }
}
