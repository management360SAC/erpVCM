package com.vcm.crm.repository;

import com.vcm.crm.entity.NpsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface NpsResponseRepository extends JpaRepository<NpsResponse, Integer> {

    @Query("SELECT r FROM NpsResponse r " +
           "WHERE r.createdAt BETWEEN :from AND :to " +
           "AND (:serviceId IS NULL OR r.clientService.service.id = :serviceId) " +
           "ORDER BY r.createdAt DESC")
    Page<NpsResponse> findByPeriod(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("serviceId") Integer serviceId,
            Pageable pageable
    );

    @Query("SELECT r FROM NpsResponse r " +
           "WHERE r.createdAt BETWEEN :from AND :to " +
           "AND (:serviceId IS NULL OR r.clientService.service.id = :serviceId)")
    List<NpsResponse> findAllByPeriod(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("serviceId") Integer serviceId
    );
}
