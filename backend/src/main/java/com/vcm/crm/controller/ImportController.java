package com.vcm.crm.controller;

import com.vcm.crm.dto.ImportDtos.*;
import com.vcm.crm.service.ImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;

    /** Vista previa de lo que se importaría sin guardar nada */
    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> preview(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo está vacío"));
        }
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Solo se aceptan archivos .xlsx o .xls"));
        }
        try {
            return ResponseEntity.ok(importService.preview(file));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error al leer el archivo: " + e.getMessage()));
        }
    }

    /** Ejecuta la importación definitiva */
    @PostMapping(value = "/ejecutar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> ejecutar(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo está vacío"));
        }
        try {
            return ResponseEntity.ok(importService.ejecutar(file));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error durante la importación: " + e.getMessage()));
        }
    }
}
