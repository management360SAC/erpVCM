package com.vcm.crm.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Alert {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // ⚠️ Cambiado de Integer a Long para mayor rango

    // ============================================================
    // CAMPOS BÁSICOS
    // ============================================================
    
    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "user_id")
    private Integer userId;

    // ============================================================
    // CAMPOS DE AUDITORÍA
    // ============================================================
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @Column(name = "read_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime readAt;

    // ============================================================
    // CAMPOS DE RECORDATORIO (NUEVOS) ⭐
    // ============================================================
    
    /**
     * Fecha y hora de la próxima ejecución del recordatorio
     * Este campo es CRÍTICO para el sistema de notificaciones
     */
    @Column(name = "proxima_ejecucion")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime proximaEjecucion;

    /**
     * Tipo de repetición: "No se repite", "Diario", "Semanal", "Mensual"
     */
    @Column(name = "repeticion", length = 50)
    private String repeticion;

    /**
     * Canal de notificación: "En la app", "Email", "WhatsApp", etc.
     */
    @Column(name = "canal", length = 50)
    private String canal;

    /**
     * Estado activo/inactivo del recordatorio
     */
    @Column(name = "activo")
    private Boolean activo;

    /**
     * ID de la entidad asociada (Lead, Cliente, Oportunidad, etc.)
     */
    @Column(name = "entidad_id")
    private Long entidadId;

    /**
     * Tipo de entidad asociada: "Lead", "Cliente", "Oportunidad", etc.
     */
    @Column(name = "entidad_tipo", length = 50)
    private String entidadTipo;

    /**
     * Descripción adicional del recordatorio (opcional)
     */
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    // ============================================================
    // LIFECYCLE CALLBACKS
    // ============================================================
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        
        // Valores por defecto
        if (activo == null) {
            activo = true;
        }
        if (repeticion == null) {
            repeticion = "No se repite";
        }
        if (canal == null) {
            canal = "En la app";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ============================================================
    // MÉTODOS DE UTILIDAD
    // ============================================================
    
    /**
     * Verifica si la alerta está leída
     */
    public boolean isLeido() {
        return readAt != null;
    }

    /**
     * Verifica si la alerta debe ejecutarse ahora
     */
    public boolean debeEjecutarse() {
        if (!Boolean.TRUE.equals(activo)) {
            return false;
        }
        if (proximaEjecucion == null) {
            return false;
        }
        if (readAt != null) {
            return false;
        }
        return proximaEjecucion.isBefore(LocalDateTime.now()) || 
               proximaEjecucion.isEqual(LocalDateTime.now());
    }

    /**
     * Marca la alerta como leída
     */
    public void marcarComoLeida() {
        this.readAt = LocalDateTime.now();
    }

    /**
     * Calcula la próxima ejecución basada en la repetición
     */
    public void calcularProximaEjecucion() {
        if (proximaEjecucion == null || repeticion == null) {
            return;
        }

        LocalDateTime siguiente = proximaEjecucion;

        switch (repeticion.toLowerCase()) {
            case "diario":
            case "diariamente":
                siguiente = proximaEjecucion.plusDays(1);
                break;
            case "semanal":
            case "semanalmente":
                siguiente = proximaEjecucion.plusWeeks(1);
                break;
            case "mensual":
            case "mensualmente":
                siguiente = proximaEjecucion.plusMonths(1);
                break;
            case "no se repite":
            default:
                // No recalcular
                return;
        }

        this.proximaEjecucion = siguiente;
        this.readAt = null; 
    }
}