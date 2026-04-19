package com.vcm.crm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vcm.crm.entity.Invoice;
import com.vcm.crm.entity.Payment;
import com.vcm.crm.repository.InvoiceRepository;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing/payments")
public class PaymentsController {

    private final BillingService billingService;
    private final PaymentRepository paymentRepo;
    private final InvoiceRepository invoiceRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    public PaymentsController(BillingService billingService,
                              PaymentRepository paymentRepo,
                              InvoiceRepository invoiceRepo) {
        this.billingService = billingService;
        this.paymentRepo = paymentRepo;
        this.invoiceRepo = invoiceRepo;
    }

    // -------------------------------------------------------
    //  GET  /api/billing/payments  — lista paginada global
    // -------------------------------------------------------
    @GetMapping
    public Page<Payment> list(@RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "paidAt"));
        return paymentRepo.findAll(pageable);
    }

    // -------------------------------------------------------
    //  GET  /api/billing/payments/by-invoice/{invoiceId}
    //  Historial de abonos de una factura (+ saldo)
    // -------------------------------------------------------
    @GetMapping("/by-invoice/{invoiceId}")
    public ResponseEntity<?> byInvoice(@PathVariable Long invoiceId) {
        Invoice inv = invoiceRepo.findById(invoiceId).orElse(null);
        if (inv == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Factura no encontrada: " + invoiceId);
        }

        List<Payment> payments = paymentRepo.findByInvoiceIdOrderByCreatedAtDesc(invoiceId);
        BigDecimal paid    = paymentRepo.sumValidByInvoiceId(invoiceId);
        BigDecimal total   = inv.getTotal() != null ? inv.getTotal() : BigDecimal.ZERO;
        BigDecimal balance = total.subtract(paid);
        if (balance.compareTo(BigDecimal.ZERO) < 0) balance = BigDecimal.ZERO;

        Map<String, Object> result = new HashMap<>();
        result.put("invoiceId",     invoiceId);
        result.put("invoiceNumber", inv.getNumber());
        result.put("total",         total);
        result.put("paid",          paid);
        result.put("balance",       balance);
        result.put("status",        inv.getStatus());
        result.put("payments",      payments);
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------
    //  POST  /api/billing/payments  — registrar nuevo pago
    // -------------------------------------------------------
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(@RequestPart("data") String dataJson,
                                    @RequestPart(value = "file", required = false) MultipartFile file)
            throws Exception {

        Map<String, Object> body = mapper.readValue(dataJson, Map.class);
        Long invoiceId   = toLong(body.get("invoiceId"));
        BigDecimal amount = new BigDecimal(String.valueOf(body.get("amount")));
        String method    = asString(body.get("method"), "TRANSFERENCIA");
        String ref       = asString(body.get("refCode"), null);
        String notes     = asString(body.get("notes"), null);

        byte[] bytes = null; String original = null; String ctype = null;
        if (file != null && !file.isEmpty()) {
            bytes = file.getBytes(); original = file.getOriginalFilename(); ctype = file.getContentType();
        }

        Payment p = billingService.registerPayment(invoiceId, amount, method, ref, notes,
                bytes, original, ctype, 1L);
        return ResponseEntity.ok(p);
    }

    // -------------------------------------------------------
    //  POST  /api/billing/payments/{id}/correct
    //  Corregir un pago incorrecto (preserva trazabilidad)
    // -------------------------------------------------------
    @PostMapping(value = "/{id}/correct", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> correct(@PathVariable Long id,
                                     @RequestPart("data") String dataJson,
                                     @RequestPart(value = "file", required = false) MultipartFile file)
            throws Exception {

        Map<String, Object> body = mapper.readValue(dataJson, Map.class);
        BigDecimal newAmount = new BigDecimal(String.valueOf(body.get("amount")));
        String method   = asString(body.get("method"), "TRANSFERENCIA");
        String ref      = asString(body.get("refCode"), null);
        String notes    = asString(body.get("notes"), null);
        String reason   = asString(body.get("correctionReason"), "Sin motivo especificado");

        byte[] bytes = null; String original = null; String ctype = null;
        if (file != null && !file.isEmpty()) {
            bytes = file.getBytes(); original = file.getOriginalFilename(); ctype = file.getContentType();
        }

        try {
            Payment corrected = billingService.correctPayment(id, newAmount, method, ref, notes,
                    reason, bytes, original, ctype, 1L);
            return ResponseEntity.ok(corrected);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------------------------------------------
    //  GET  /api/billing/payments/{id}/file  — descargar archivo
    // -------------------------------------------------------
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
        headers.setContentDisposition(ContentDisposition.builder("inline")
                .filename(p.getFileName() != null ? p.getFileName() : f.getName())
                .build());
        headers.setContentType(MediaType.parseMediaType(
                p.getContentType() != null ? p.getContentType() : "application/octet-stream"));
        return new ResponseEntity<>(res, headers, HttpStatus.OK);
    }

    // -------------------------------------------------------
    //  Helpers
    // -------------------------------------------------------
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
