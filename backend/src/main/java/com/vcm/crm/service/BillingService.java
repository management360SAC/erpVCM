package com.vcm.crm.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import com.vcm.crm.repository.PaymentRepository;
import com.vcm.crm.repository.PaymentSequenceRepository;
import com.vcm.crm.repository.InvoiceRepository;
import com.vcm.crm.repository.ContractedServiceRepository;

import com.vcm.crm.entity.Payment;
import com.vcm.crm.entity.PaymentSequence;
import com.vcm.crm.entity.Invoice;
import com.vcm.crm.entity.ContractedService;
import com.vcm.crm.entity.ContractedService.CollectionStatus;

import java.nio.file.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.Optional;

@Service
public class BillingService {

    private final PaymentRepository paymentRepo;
    private final PaymentSequenceRepository seqRepo;
    private final InvoiceRepository invoiceRepo;
    private final ContractedServiceRepository csRepo;

    @Value("${app.payments.storage:/data/payments}")
    private String paymentsRoot;

    public BillingService(PaymentRepository p, PaymentSequenceRepository s,
                          InvoiceRepository i, ContractedServiceRepository csRepo) {
        this.paymentRepo = p;
        this.seqRepo = s;
        this.invoiceRepo = i;
        this.csRepo = csRepo;
    }

    @Transactional
    String nextPaymentNumber() {
        int y = java.time.LocalDate.now().getYear();
        PaymentSequence seq = seqRepo.findById(y).orElse(new PaymentSequence(y, 0));
        seq.setLastNumber(seq.getLastNumber() + 1);
        seqRepo.save(seq);
        return String.format("PAY-%d-%04d", y, seq.getLastNumber());
    }

    @Transactional
    public Payment registerPayment(Long invoiceId, BigDecimal amount,
                                   String method, String ref, String notes,
                                   byte[] bytes, String original, String ctype,
                                   Long userId) throws Exception {

        Invoice inv = invoiceRepo.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Factura no existe"));

        String number = nextPaymentNumber();
        Path dir = Paths.get(paymentsRoot, String.valueOf(Year.now().getValue()));
        Files.createDirectories(dir);

        Path filePath = null;
        if (bytes != null && bytes.length > 0 && original != null) {
            String safeName = number + "-" + original.replaceAll("[^A-Za-z0-9._-]", "_");
            filePath = dir.resolve(safeName);
            Files.write(filePath, bytes);
        }

        Payment p = new Payment();
        p.setNumber(number);
        p.setInvoiceId(invoiceId);
        p.setAmount(amount);
        p.setMethod((method != null) ? method : "TRANSFERENCIA");
        p.setRefCode(ref);
        p.setNotes(notes);
        p.setPaidAt(LocalDateTime.now());
        if (filePath != null) {
            p.setFileName(original);
            p.setFilePath(filePath.toString());
            p.setContentType(ctype);
            p.setFileSize((long) bytes.length);
        }
        p.setCreatedBy(userId);
        paymentRepo.save(p);

        // Recalcular pagos y actualizar estado de la factura
        BigDecimal pagado = paymentRepo.sumByInvoiceId(invoiceId);
        if (inv.getTotal() != null) {
            if (pagado.compareTo(inv.getTotal()) >= 0) {
                inv.setStatus("PAGADA_TOTAL");
            } else if (pagado.compareTo(BigDecimal.ZERO) > 0) {
                inv.setStatus("PAGADA_PARCIAL");
            } else {
                inv.setStatus("EMITIDA");
            }
        }
        invoiceRepo.save(inv);

        // Actualizar ejes del Servicio Contratado (Cobro) y facturación
        if (inv.getContractedServiceId() != null) {
            ContractedService cs = csRepo.findById(inv.getContractedServiceId()).orElse(null);
            if (cs != null) {
                switch (inv.getStatus()) {
                    case "PAGADA_TOTAL":
                        cs.setCollectionStatus(CollectionStatus.COBRADO);
                        break;
                    case "PAGADA_PARCIAL":
                        cs.setCollectionStatus(CollectionStatus.COBRO_PARCIAL);
                        break;
                    default:
                        cs.setCollectionStatus(CollectionStatus.PENDIENTE_COBRO);
                }
                csRepo.save(cs);

                // ✅ asegurar que el eje "Facturación" quede FACTURADO si hay facturas del servicio
                recomputeBillingForService(cs.getId());
            }
        }
        return p;
    }

    /** Marca FACTURADO si existe alguna factura (EMITIDA/PARCIAL/TOTAL) del servicio. */
    @Transactional
    public void recomputeBillingForService(Long csId) {
        if (csId == null) return;
        
        // ✅ CORREGIDO: No usar "var" en Java 8
        Optional<ContractedService> csOpt = csRepo.findById(csId);
        if (!csOpt.isPresent()) return;
        ContractedService cs = csOpt.get();

        // Opción simple y rápida:
        boolean tieneFactura = invoiceRepo.existsByContractedServiceId(csId);

        if (tieneFactura) {
            // ✅ CORREGIDO: Usar FACTURADO_TOTAL en lugar de FACTURADO
            cs.setBillingStatus(ContractedService.BillingStatus.FACTURADO_TOTAL);
            csRepo.save(cs);
        }
    }
}
