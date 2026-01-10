package com.vcm.crm.repository;

import com.vcm.crm.entity.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    /**
     * Busca alertas por usuario
     */
    Page<Alert> findByUserId(Integer userId, Pageable pageable);

    /**
     * Busca alertas activas
     */
    Page<Alert> findByActivo(Boolean activo, Pageable pageable);

    /**
     * 🔹 Soporte a AlertService.listAlerts()
     *    Devuelve alertas NO leídas (readAt = null)
     *    usando query derivada de Spring Data.
     */
    Page<Alert> findByReadAtIsNull(Pageable pageable);

    /**
     * Busca alertas no leídas (readAt es null) con @Query
     * (si no la usas, podrías eliminarla, pero la dejo por si acaso)
     */
    @Query("SELECT a FROM Alert a WHERE a.readAt IS NULL")
    Page<Alert> findUnread(Pageable pageable);

    /**
     * Busca alertas leídas (readAt no es null)
     */
    @Query("SELECT a FROM Alert a WHERE a.readAt IS NOT NULL")
    Page<Alert> findRead(Pageable pageable);

    /**
     * Busca alertas activas y no leídas
     */
    @Query("SELECT a FROM Alert a WHERE a.activo = true AND a.readAt IS NULL")
    Page<Alert> findActiveAndUnread(Pageable pageable);

    /**
     * Busca alertas que deben ejecutarse AHORA
     * (activas, no leídas, y con proximaEjecucion <= ahora)
     */
    @Query("SELECT a FROM Alert a WHERE " +
           "a.activo = true AND " +
           "a.readAt IS NULL AND " +
           "a.proximaEjecucion IS NOT NULL AND " +
           "a.proximaEjecucion <= :now " +
           "ORDER BY a.proximaEjecucion ASC")
    List<Alert> findPendingAlerts(@Param("now") LocalDateTime now);

    /**
     * Busca alertas que deben ejecutarse AHORA con paginación
     */
    @Query("SELECT a FROM Alert a WHERE " +
           "a.activo = true AND " +
           "a.readAt IS NULL AND " +
           "a.proximaEjecucion IS NOT NULL AND " +
           "a.proximaEjecucion <= :now " +
           "ORDER BY a.proximaEjecucion ASC")
    Page<Alert> findPendingAlerts(@Param("now") LocalDateTime now, Pageable pageable);

    /**
     * Busca alertas por tipo de entidad
     */
    Page<Alert> findByEntidadTipoAndEntidadId(
        String entidadTipo,
        Long entidadId,
        Pageable pageable
    );

    /**
     * Busca alertas por canal
     */
    Page<Alert> findByCanal(String canal, Pageable pageable);

    /**
     * Busca alertas con filtros combinados (query dinámica)
     */
    @Query("SELECT a FROM Alert a WHERE " +
           "(:activo IS NULL OR a.activo = :activo) AND " +
           "(:leido IS NULL OR " +
           "  (:leido = true AND a.readAt IS NOT NULL) OR " +
           "  (:leido = false AND a.readAt IS NULL)" +
           ") AND " +
           "(:userId IS NULL OR a.userId = :userId)")
    Page<Alert> findWithFilters(
        @Param("activo") Boolean activo,
        @Param("leido") Boolean leido,
        @Param("userId") Integer userId,
        Pageable pageable
    );

    /**
     * Cuenta alertas pendientes para un usuario
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE " +
           "a.userId = :userId AND " +
           "a.activo = true AND " +
           "a.readAt IS NULL AND " +
           "a.proximaEjecucion IS NOT NULL AND " +
           "a.proximaEjecucion <= :now")
    long countPendingByUser(
        @Param("userId") Integer userId,
        @Param("now") LocalDateTime now
    );

    /**
     * Busca alertas por repetición
     */
    Page<Alert> findByRepeticion(String repeticion, Pageable pageable);
}
