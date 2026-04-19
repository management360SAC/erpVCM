// src/main/java/com/vcm/crm/controller/InvoiceController.java
package com.vcm.crm.controller;

import com.vcm.crm.entity.Invoice;
import com.vcm.crm.repository.InvoiceRepository;
import com.vcm.crm.repository.PaymentRepository;
import com.vcm.crm.service.InvoiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/billing/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepo;
    private final PaymentRepository paymentRepo;

    public InvoiceController(InvoiceService invoiceService,
                             InvoiceRepository invoiceRepo,
                             PaymentRepository paymentRepo) {
        this.invoiceService = invoiceService;
        this.invoiceRepo    = invoiceRepo;
        this.paymentRepo    = paymentRepo;
    }

    // -------------------------------------------------------
    //  POST /api/billing/invoices/ensure-open
    //  Asegura que exista una factura abierta para el servicio.
    //  Ahora también devuelve paid y balance.
    // -------------------------------------------------------
    @PostMapping("/ensure-open")
    public Map<String, Object> ensureOpen(@RequestBody Map<String, Object> body) {
        Object csIdObj = body.get("contractedServiceId");
        Long csId = null;

        if (csIdObj instanceof Integer) {
            csId = ((Integer) csIdObj).longValue();
        } else if (csIdObj instanceof Long) {
            csId = (Long) csIdObj;
        } else if (csIdObj instanceof String) {
            csId = Long.parseLong((String) csIdObj);
        }

        if (csId == null) {
            throw new IllegalArgumentException("contractedServiceId es requerido");
        }

        Invoice inv = invoiceService.ensureOpenInvoiceForService(csId);

        BigDecimal total   = inv.getTotal() != null ? inv.getTotal() : BigDecimal.ZERO;
        BigDecimal paid    = paymentRepo.sumValidByInvoiceId(inv.getId());
        BigDecimal balance = total.subtract(paid);
        if (balance.compareTo(BigDecimal.ZERO) < 0) balance = BigDecimal.ZERO;

        Map<String, Object> r = new HashMap<>();
        r.put("id",      inv.getId());
        r.put("number",  inv.getNumber());
        r.put("total",   total);
        r.put("paid",    paid);
        r.put("balance", balance);
        r.put("status",  inv.getStatus());
        return r;
    }

    // -------------------------------------------------------
    //  GET /api/billing/invoices/{id}
    //  Detalle de factura con saldo en tiempo real
    // -------------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        Invoice inv = invoiceRepo.findById(id).orElse(null);
        if (inv == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        BigDecimal total   = inv.getTotal() != null ? inv.getTotal() : BigDecimal.ZERO;
        BigDecimal paid    = paymentRepo.sumValidByInvoiceId(id);
        BigDecimal balance = total.subtract(paid);
        if (balance.compareTo(BigDecimal.ZERO) < 0) balance = BigDecimal.ZERO;

        Map<String, Object> r = new HashMap<>();
        r.put("id",                  inv.getId());
        r.put("number",              inv.getNumber());
        r.put("total",               total);
        r.put("paid",                paid);
        r.put("balance",             balance);
        r.put("status",              inv.getStatus());
        r.put("contractedServiceId", inv.getContractedServiceId());
        r.put("issueDate",           inv.getIssueDate());
        return ResponseEntity.ok(r);
    }
}
