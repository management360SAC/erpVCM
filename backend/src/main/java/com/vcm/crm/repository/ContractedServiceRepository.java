// src/main/java/com/vcm/crm/repository/ContractedServiceRepository.java
package com.vcm.crm.repository;

import com.vcm.crm.entity.ContractedService;
import com.vcm.crm.entity.ContractedService.ServiceStatus;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ContractedServiceRepository extends JpaRepository<ContractedService, Long> {

    /* ===================== Listados básicos ===================== */

    Page<ContractedService> findByOrgId(Long orgId, Pageable pageable);

    Page<ContractedService> findByOrgIdAndStatus(Long orgId, ServiceStatus status, Pageable pageable);

    Optional<ContractedService> findByQuoteId(Long quoteId);


    /* ===================== Búsquedas derivadas seguras ===================== */

    // Buscar por número (case-insensitive)
    Page<ContractedService> findByOrgIdAndNumberContainingIgnoreCase(Long orgId, String number, Pageable pageable);

    // Buscar por clientId exacto (útil si q es numérica)
    Page<ContractedService> findByOrgIdAndClientId(Long orgId, Long clientId, Pageable pageable);


    /* ===================== Búsqueda flexible null-safe (JDK8) ===================== */
    // Filtra SIEMPRE por orgId.
    // Si q es nulo/vacío, ignora el filtro por número.
    // Si clientId es nulo, ignora el filtro por clientId.
    @Query("SELECT cs " +
           "FROM ContractedService cs " +
           "WHERE cs.orgId = :orgId " +
           "  AND ( :q IS NULL OR :q = '' OR LOWER(cs.number) LIKE LOWER(CONCAT('%', :q, '%')) ) " +
           "  AND ( :clientId IS NULL OR cs.clientId = :clientId )")
    Page<ContractedService> searchByOrgIdFlexible(
            @Param("orgId") Long orgId,
            @Param("q") String q,
            @Param("clientId") Long clientId,
            Pageable pageable
    );

    /* ===================== Wrapper para compatibilidad (firma antigua) ===================== */
    // Si tu Service todavía llama searchByOrgId(orgId, q, pageable), este método lo soporta.
    @Query("SELECT cs " +
           "FROM ContractedService cs " +
           "WHERE cs.orgId = :orgId " +
           "  AND ( :q IS NULL OR :q = '' OR LOWER(cs.number) LIKE LOWER(CONCAT('%', :q, '%')) )")
    Page<ContractedService> searchByOrgId(@Param("orgId") Long orgId,
                                          @Param("q") String q,
                                          Pageable pageable);


    /* ===================== Último número por año ===================== */
    @Query("SELECT cs.number " +
           "FROM ContractedService cs " +
           "WHERE cs.orgId = :orgId " +
           "  AND cs.number LIKE CONCAT('SVC-', :year, '-%') " +
           "ORDER BY cs.number DESC")
    List<String> findLastNumberByYear(@Param("orgId") Long orgId, @Param("year") String year);

    @Query("select cs from ContractedService cs " +
       "where cs.orgId = :orgId and cs.collectionStatus = 'PENDIENTE_COBRO'")
       List<ContractedService> findPendingCollection(@Param("orgId") Long orgId);
@Query("SELECT cs FROM ContractedService cs " +
       "WHERE cs.orgId = :orgId AND cs.collectionStatus = 'PENDIENTE_COBRO'")
List<ContractedService> findPendingBilling(@Param("orgId") Long orgId);


}
