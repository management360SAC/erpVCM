package com.vcm.crm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

import com.vcm.crm.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

  @Query("select coalesce(sum(p.amount), 0) from Payment p where p.invoiceId in (" +
         "select i.id from Invoice i where i.contractedServiceId = :csId)")
  BigDecimal sumByContractedServiceId(@Param("csId") Long contractedServiceId);

  @Query("select coalesce(sum(p.amount),0) from Payment p where p.invoiceId = :invoiceId")
  BigDecimal sumByInvoiceId(@Param("invoiceId") Long invoiceId);
}
