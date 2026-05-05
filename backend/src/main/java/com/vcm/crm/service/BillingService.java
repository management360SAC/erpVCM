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

    // =========================================================
    //  REGISTRAR PAGO NORMAL (admite también pagos parciales)
    // =========================================================
    @Transactional
    public Payment registerPayment(Long invoiceId, BigDecimal amount,
                                   String method, String ref, String notes,
                                   byte[] bytes, String original, String ctype,
                                   Long userId) throws Exception {

        Invoice inv = invoiceRepo.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Factura no existe: " + invoiceId));

        if ("PAGADA_TOTAL".equals(inv.getStatus())) {
            throw new IllegalArgumentException("La factura ya está pagada en su totalidad.");
        }

        BigDecimal pagadoPrevio = paymentRepo.sumValidByInvoiceId(invoiceId);
        if (pagadoPrevio == null) pagadoPrevio = BigDecimal.ZERO;
        BigDecimal saldo = inv.getTotal().subtract(pagadoPrevio);
        if (amount.compareTo(saldo) > 0) {
            throw new IllegalArgumentException(
                String.format("El monto S/ %.2f supera el saldo pendiente S/ %.2f", amount, saldo));
        }

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
        p.setStatus("VALIDO");
        if (filePath != null) {
            p.setFileName(original);
            p.setFilePath(filePath.toString());
            p.setContentType(ctype);
            p.setFileSize((long) bytes.length);
        }
        p.setCreatedBy(userId);
        paymentRepo.save(p);

        // Recalcular con pagos VÁLIDOS únicamente
        recalcInvoiceAndService(inv);

        return p;
    }

    // =========================================================
    //  CORREGIR UN PAGO EXISTENTE
    //  - Marca el original como CORREGIDO
    //  - Crea un nuevo pago VALIDO con el monto correcto
    // =========================================================
    @Transactional
    public Payment correctPayment(Long originalPaymentId,
                                  BigDecimal newAmount,
                                  String method, String ref, String notes,
                                  String correctionReason,
                                  byte[] bytes, String originalFilename, String ctype,
                                  Long userId) throws Exception {

        Payment orig = paymentRepo.findById(originalPaymentId)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado: " + originalPaymentId));

        if (!"VALIDO".equals(orig.getStatus())) {
            throw new IllegalArgumentException("Solo se pueden corregir pagos en estado VALIDO.");
        }

        // 1. Marcar el pago original como CORREGIDO
        orig.setStatus("CORREGIDO");
        orig.setCorrectionReason(correctionReason != null ? correctionReason : "Corrección sin motivo especificado");
        paymentRepo.save(orig);

        // 2. Registrar el pago correcto como nuevo registro
        Payment corrected = registerPayment(orig.getInvoiceId(), newAmount, method, ref, notes,
                bytes, originalFilename, ctype, userId);

        // 3. Enlazar corrección con el original
        corrected.setCorrectionOf(originalPaymentId);
        paymentRepo.save(corrected);

        return corrected;
    }

    // =========================================================
    //  RECALCULAR ESTADO DE FACTURA Y SERVICIO CONTRATADO
    // =========================================================
    @Transactional
    public void recalcInvoiceAndService(Invoice inv) {
        // Solo sumar pagos VÁLIDOS
        BigDecimal pagado = paymentRepo.sumValidByInvoiceId(inv.getId());

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

        // Actualizar estado del servicio contratado
        if (inv.getContractedServiceId() != null) {
            Optional<ContractedService> csOpt = csRepo.findById(inv.getContractedServiceId());
            if (csOpt.isPresent()) {
                ContractedService cs = csOpt.get();
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
                recomputeBillingForService(cs.getId());
            }
        }
    }

    /** Marca FACTURADO si existe alguna factura para el servicio */
    @Transactional
    public void recomputeBillingForService(Long csId) {
        if (csId == null) return;
        Optional<ContractedService> csOpt = csRepo.findById(csId);
        if (!csOpt.isPresent()) return;
        ContractedService cs = csOpt.get();
        boolean tieneFactura = invoiceRepo.existsByContractedServiceId(csId);
        if (tieneFactura) {
            cs.setBillingStatus(ContractedService.BillingStatus.FACTURADO_TOTAL);
            csRepo.save(cs);
        }
    }
}
