package com.vcm.crm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

import com.vcm.crm.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

  /** Suma total pagado por factura (todos los pagos, incl. corregidos) */
  @Query("select coalesce(sum(p.amount), 0) from Payment p where p.invoiceId in (" +
         "select i.id from Invoice i where i.contractedServiceId = :csId)")
  BigDecimal sumByContractedServiceId(@Param("csId") Long contractedServiceId);

  /** Suma pagos VÁLIDOS por factura (excluye CORREGIDO/ANULADO) */
  @Query("select coalesce(sum(p.amount),0) from Payment p " +
         "where p.invoiceId = :invoiceId and p.status = 'VALIDO'")
  BigDecimal sumValidByInvoiceId(@Param("invoiceId") Long invoiceId);

  /** Suma pagos VÁLIDOS por servicio contratado */
  @Query("select coalesce(sum(p.amount), 0) from Payment p " +
         "where p.invoiceId in (" +
         "  select i.id from Invoice i where i.contractedServiceId = :csId" +
         ") and p.status = 'VALIDO'")
  BigDecimal sumValidByContractedServiceId(@Param("csId") Long csId);

  /** Historial de pagos de una factura, más reciente primero */
  List<Payment> findByInvoiceIdOrderByCreatedAtDesc(Long invoiceId);
}
