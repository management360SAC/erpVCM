package com.vcm.crm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vcm.crm.entity.Payment;
import com.vcm.crm.repository.PaymentRepository;
import com.vcm.crm.service.BillingService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/billing/payments")
public class PaymentsController {  // ✅ CORREGIDO: nombre coincide con archivo

    private final BillingService billingService;
    private final PaymentRepository paymentRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    public PaymentsController(BillingService billingService, PaymentRepository paymentRepo) {
        this.billingService = billingService;
        this.paymentRepo = paymentRepo;
    }

    @GetMapping
    public Page<Payment> list(@RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "paidAt"));
        return paymentRepo.findAll(pageable);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(@RequestPart("data") String dataJson,
                                    @RequestPart(value = "file", required = false) MultipartFile file) throws Exception {
        Map<String, Object> body = mapper.readValue(dataJson, Map.class);
        Long invoiceId = toLong(body.get("invoiceId"));
        BigDecimal amount = new BigDecimal(String.valueOf(body.get("amount")));
        String method = asString(body.get("method"), "TRANSFERENCIA");
        String ref = asString(body.get("refCode"), null);
        String notes = asString(body.get("notes"), null);

        byte[] bytes = null;
        String original = null;
        String ctype = null;
        if (file != null && !file.isEmpty()) {
            bytes = file.getBytes();
            original = file.getOriginalFilename();
            ctype = file.getContentType();
        }

        Payment p = billingService.registerPayment(invoiceId, amount, method, ref, notes,
                bytes, original, ctype, 1L);
        return ResponseEntity.ok(p);
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        Payment p = paymentRepo.findById(id).orElse(null);
        if (p == null || p.getFilePath() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        File f = new File(p.getFilePath());
        if (!f.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        FileSystemResource res = new FileSystemResource(f);
        HttpHeaders headers = new HttpHeaders();
        // ✅ CORREGIDO: ContentDisposition.builder() en lugar de .inline()
        headers.setContentDisposition(ContentDisposition.builder("inline")
                .filename(p.getFileName() != null ? p.getFileName() : f.getName())
                .build());
        headers.setContentType(MediaType.parseMediaType(
                p.getContentType() != null ? p.getContentType() : "application/octet-stream"));
        return new ResponseEntity<>(res, headers, HttpStatus.OK);
    }

    private static Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Integer) return ((Integer) o).longValue();
        if (o instanceof Long) return (Long) o;
        return Long.parseLong(String.valueOf(o));
    }

    private static String asString(Object o, String def) {
        return o != null ? String.valueOf(o) : def;
    }
}
