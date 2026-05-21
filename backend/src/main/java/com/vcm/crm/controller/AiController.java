package com.vcm.crm.controller;

import com.vcm.crm.dto.AiDtos;
import com.vcm.crm.service.AiService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private static final Logger log = LoggerFactory.getLogger(AiController.class);

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<AiDtos.AiChatResponse> chat(@Valid @RequestBody AiDtos.AiChatRequest req) {
        try {
            String reply = aiService.chat(req.getMessage(), req.getContextType());
            return ResponseEntity.ok(new AiDtos.AiChatResponse(reply));
        } catch (Exception e) {
            return ResponseEntity.ok(new AiDtos.AiChatResponse(
                "Lo siento, ocurrió un error al procesar tu consulta. Intenta de nuevo en unos momentos."
            ));
        }
    }

    @PostMapping("/generate-image")
    public ResponseEntity<?> generateImage(@Valid @RequestBody AiDtos.AiImageRequest req) {
        try {
            AiDtos.AiImageResponse response = aiService.generateFiscalImage(req.getPrompt());
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Collections.singletonMap("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error generando imagen: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al generar la imagen. Intenta de nuevo."));
        }
    }

    @PostMapping(value = "/email/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> sendEmail(
            @RequestParam("to")       String to,
            @RequestParam("subject")  String subject,
            @RequestParam("htmlBody") String htmlBody,
            @RequestParam(value = "pdf", required = false) MultipartFile pdf
    ) {
        if (to == null || to.trim().isEmpty() || subject == null || subject.trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("status", "error");
            err.put("message", "Los campos 'to' y 'subject' son requeridos.");
            return ResponseEntity.badRequest().body(err);
        }
        try {
            byte[] pdfBytes    = (pdf != null && !pdf.isEmpty()) ? pdf.getBytes() : null;
            String pdfFilename = (pdf != null && !pdf.isEmpty()) ? pdf.getOriginalFilename() : null;
            aiService.sendEmail(to.trim(), subject.trim(), htmlBody, pdfBytes, pdfFilename);
            Map<String, String> ok = new HashMap<>();
            ok.put("status", "ok");
            ok.put("message", "Correo enviado a " + to.trim());
            return ResponseEntity.ok(ok);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("status", "error");
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("Error enviando email via IA: {}", e.getMessage(), e);
            Map<String, String> err = new HashMap<>();
            err.put("status", "error");
            err.put("message", "Error al enviar: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }
}
