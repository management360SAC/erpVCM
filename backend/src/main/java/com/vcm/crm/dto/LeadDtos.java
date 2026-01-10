package com.vcm.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTOs agrupados para Leads.
 * Asegúrate de que el archivo se llame EXACTAMENTE LeadDtos.java
 * y esté en el directorio: src/main/java/com/vcm/crm/dto
 */
public class LeadDtos {

    // =========================================================
    // DTO que devuelve el backend a la tabla de Leads
    // =========================================================
    @Data
    @Builder
    public static class LeadDto {
        private Integer id;

        private String formSlug;
        private String formName;
        private String sourceCode;

        private String fullName;
        private String email;
        private String phone;
        private String message;

        private String status;          // NEW, IN_PROGRESS, etc.
        private LocalDateTime createdAt;

        // --- Campos CRM extra (los que usa tu frontend) ---
        private String company;
        private Integer serviceId;      // <--- NUEVO
        private String serviceName;
        private String interest;        // INFO, QUOTE, HIRE, OTHER
        private String budgetRange;
        private String timeframe;
        private String priority;        // HIGH, MEDIUM, LOW
        private String ownerName;
        private LocalDate nextActionDate;
    }

    // =========================================================
    // Crear lead DESDE CRM (Nuevo lead modal)
    // =========================================================
    @Data
    public static class LeadCreateRequest {
        private String fullName;
        private String email;
        private String phone;
        private String message;
        private Integer serviceId;
        private String sourceCode;

        // nuevos campos CRM
        private String company;
        private String serviceName;
        private String interest;
        private String budgetRange;
        private String timeframe;
        private String priority;
        private String ownerName;
        private LocalDate nextActionDate;
    }

    // =========================================================
    // Actualizar lead DESDE CRM (modal Editar lead)
    // =========================================================
    @Data
    public static class LeadUpdateRequest {
        private String fullName;
        private String email;
        private String phone;
        private String message;
        private Integer serviceId;
        private String sourceCode;
        private String status;

        // nuevos campos CRM
        private String company;
        private String serviceName;
        private String interest;
        private String budgetRange;
        private String timeframe;
        private String priority;
        private String ownerName;
        private LocalDate nextActionDate;
    }

    // =========================================================
    // Actualizar solo el estado (PUT /api/leads/{id}/status)
    // =========================================================
    @Data
    public static class LeadStatusUpdateRequest {
        private String status; // NEW, IN_PROGRESS, CONTACTED, etc.
    }

    // =========================================================
    // Crear lead PÚBLICO (landing, webhook) /api/leads/public/{slug}
    // =========================================================
    @Data
    public static class LeadPublicCreateRequest {
        private String fullName;
        private String email;
        private String phone;
        private String message;
        private Integer serviceId;
        private String sourceCode;

        // tracking / utm
        private String utmSource;
        private String utmMedium;
        private String utmCampaign;
        private String utmTerm;
        private String utmContent;
        private String referrer;
        private String gclid;
        private String fbclid;

        private String rawPayload; // JSON crudo opcional
    }
}
