// src/main/java/com/vcm/crm/repository/InvoiceRepository.java
package com.vcm.crm.repository;

import com.vcm.crm.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    /** Última factura abierta (EMITIDA o PAGADA_PARCIAL) para un servicio */
    Invoice findTopByContractedServiceIdAndStatusInOrderByCreatedAtDesc(
        Long contractedServiceId,
        List<String> statuses
    );

    /** Suma total facturado por servicio contratado */
    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.contractedServiceId = :contractedServiceId")
    BigDecimal sumTotalByContractedServiceId(@Param("contractedServiceId") Long contractedServiceId);

    /** Todas las facturas de un servicio contratado */
    List<Invoice> findByContractedServiceIdOrderByCreatedAtDesc(Long contractedServiceId);

    /** Todas las facturas por organización */
    List<Invoice> findByOrgIdOrderByCreatedAtDesc(Long orgId);

    /** ✅ Necesario para BillingService.recomputeBillingForService */
    boolean existsByContractedServiceId(Long contractedServiceId);
}
