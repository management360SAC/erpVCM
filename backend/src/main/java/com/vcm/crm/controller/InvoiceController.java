// src/main/java/com/vcm/crm/controller/InvoiceController.java
package com.vcm.crm.controller;

import com.vcm.crm.entity.Invoice;
import com.vcm.crm.service.InvoiceService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/billing/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    /** Asegura que exista una factura "abierta" (EMITIDA o PAGADA_PARCIAL) para el servicio */
    @PostMapping("/ensure-open")
    public Map<String, Object> ensureOpen(@RequestBody Map<String, Object> body) {
        // Convertir el contractedServiceId que viene del body
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
        
        Map<String, Object> r = new HashMap<String, Object>();
        r.put("id", inv.getId());
        r.put("number", inv.getNumber());
        r.put("total", inv.getTotal());
        r.put("status", inv.getStatus());
        
        return r;
    }
}