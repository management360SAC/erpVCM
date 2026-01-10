package com.vcm.crm.repository;

import com.vcm.crm.entity.Lead;
import com.vcm.crm.model.LeadStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface LeadRepository extends JpaRepository<Lead, Integer>, JpaSpecificationExecutor<Lead> {
    
    Page<Lead> findByStatusAndFullNameContainingIgnoreCase(
        LeadStatus status,
        String fullName,
        Pageable pageable
    );
    
    Page<Lead> findByFullNameContainingIgnoreCase(
        String fullName,
        Pageable pageable
    );
    
    // Estadísticas por fuente
    @Query("SELECT l.sourceCode AS source, COUNT(l) AS total " +
           "FROM Lead l WHERE l.createdAt BETWEEN :from AND :to " +
           "GROUP BY l.sourceCode")
    List<Object[]> statsBySource(
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );
    
    // Estadísticas por formulario web
    @Query("SELECT l.form.name AS formName, COUNT(l) AS total " +
           "FROM Lead l WHERE l.form IS NOT NULL AND l.createdAt BETWEEN :from AND :to " +
           "GROUP BY l.form.name")
    List<Object[]> statsByForm(
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );
    
    // Total de leads en rango de fecha
    Long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
}