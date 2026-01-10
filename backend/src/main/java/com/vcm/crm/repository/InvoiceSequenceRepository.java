// src/main/java/com/vcm/crm/repository/InvoiceSequenceRepository.java
package com.vcm.crm.repository;

import com.vcm.crm.entity.InvoiceSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.util.Optional;

public interface InvoiceSequenceRepository extends JpaRepository<InvoiceSequence, Long> {

    /**
     * Busca la secuencia por orgId y año con bloqueo pesimista
     * para evitar duplicados en concurrencia.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT seq FROM InvoiceSequence seq WHERE seq.orgId = :orgId AND seq.year = :year")
    Optional<InvoiceSequence> findByOrgIdAndYearWithLock(
        @Param("orgId") Long orgId, 
        @Param("year") Integer year
    );

    /**
     * Busca sin bloqueo (solo lectura)
     */
    Optional<InvoiceSequence> findByOrgIdAndYear(Long orgId, Integer year);
}