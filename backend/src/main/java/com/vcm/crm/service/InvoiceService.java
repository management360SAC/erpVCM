// src/main/java/com/vcm/crm/service/InvoiceService.java
package com.vcm.crm.service;

import com.vcm.crm.entity.ContractedService;
import com.vcm.crm.entity.Invoice;
import com.vcm.crm.entity.InvoiceSequence;
import com.vcm.crm.repository.ContractedServiceRepository;
import com.vcm.crm.repository.InvoiceRepository;
import com.vcm.crm.repository.InvoiceSequenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepo;
    private final ContractedServiceRepository csRepo;
    private final InvoiceSequenceRepository seqRepo;
    private final BillingService billingService;

    public InvoiceService(InvoiceRepository invoiceRepo,
                          ContractedServiceRepository csRepo,
                          InvoiceSequenceRepository seqRepo,
                          BillingService billingService) {
        this.invoiceRepo = invoiceRepo;
        this.csRepo = csRepo;
        this.seqRepo = seqRepo;
        this.billingService = billingService;
    }

    /** Devuelve la factura abierta del servicio (EMITIDA o PAGADA_PARCIAL) o crea una nueva EMITIDA */
    @Transactional
    public Invoice ensureOpenInvoiceForService(Long contractedServiceId) {
        if (contractedServiceId == null) {
            throw new IllegalArgumentException("contractedServiceId es requerido");
        }

        // 1) Buscar factura “abierta” existente
        Invoice abierta = invoiceRepo.findTopByContractedServiceIdAndStatusInOrderByCreatedAtDesc(
                contractedServiceId, Arrays.asList("EMITIDA", "PAGADA_PARCIAL"));
        if (abierta != null) {
            // Asegura eje de “Facturación”
            billingService.recomputeBillingForService(contractedServiceId);
            return abierta;
        }

        // 2) Crear nueva EMITIDA
        ContractedService cs = csRepo.findById(contractedServiceId)
                .orElseThrow(() -> new IllegalArgumentException("Servicio contratado no existe"));

        String number = nextInvoiceNumber(cs.getOrgId());

        Invoice inv = new Invoice();
        inv.setNumber(number);
        inv.setContractedServiceId(contractedServiceId);
        inv.setClientId(cs.getClientId());
        inv.setOrgId(cs.getOrgId());
        inv.setSubTotal(cs.getSubTotal());
        inv.setIgv(cs.getIgv());
        inv.setTotal(cs.getTotal());
        inv.setCurrency("PEN");
        inv.setStatus("EMITIDA");
        inv.setIssueDate(java.time.LocalDate.now());
        inv.setCreatedAt(LocalDateTime.now());

        inv = invoiceRepo.save(inv);

        // ✅ Marca “FACTURADO” en el contratado
        billingService.recomputeBillingForService(contractedServiceId);

        return inv;
    }

    /** Genera INV-YYYY-#### por organización */
    @Transactional
    protected String nextInvoiceNumber(Long orgId) {
        int year = java.time.LocalDate.now().getYear();
        InvoiceSequence seq = seqRepo.findByOrgIdAndYear(orgId, year)
                .orElseGet(() -> {
                    InvoiceSequence s = new InvoiceSequence();
                    s.setOrgId(orgId);
                    s.setYear(year);
                    s.setLastNumber(0);
                    return s;
                });
        seq.setLastNumber(seq.getLastNumber() + 1);
        seqRepo.save(seq);
        return String.format("INV-%d-%04d", year, seq.getLastNumber());
    }
}
