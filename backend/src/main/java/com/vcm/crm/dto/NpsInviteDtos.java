// src/main/java/com/vcm/crm/dto/NpsInviteDtos.java
package com.vcm.crm.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTOs relacionados a invitaciones NPS.
 *
 * OJO: el frontend de encuesta espera que InviteInfo tenga al menos:
 * - serviceName (para mostrar en la pregunta)
 * - clientName (opcional, solo para info)
 * - y el resto de campos te sirven para trazabilidad / panel interno.
 */
public class NpsInviteDtos {

  // ============================================================
  // Crear invitación desde el backend (por ejemplo, desde Ops)
  // ============================================================
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class CreateInviteRequest {
    private Integer clientServiceId;  // relación cliente-servicio
    private String email;             // correo al que se enviará la invitación
  }

  // ============================================================
  // Info que se devuelve tanto al crear como al consultar por token
  // (GET /api/nps/public/invite/{token})
  // ============================================================
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class InviteInfo {
    private Integer id;
    private String email;
    private String token;

    /**
     * URL pública que puedes usar para armar el correo.
     * Ejemplo: https://tudominio.com/nps?token=XXXX
     */
    private String publicUrl;

    private LocalDateTime sentAt;
    private LocalDateTime expiresAt;
    private LocalDateTime respondedAt;
    private String status; // PENDING, EXPIRED, RESPONDED, etc.

    // Para que el front pueda mostrar un texto agradable
    private String serviceName; // "Servicio contable mensual", etc.
    private String clientName;  // "Empresa ABC", opcional
  }

  // ============================================================
  // Body del POST /api/nps/public/answer
  // ============================================================
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class PublicAnswerRequest {
    /** Token único de la invitación (viene en la URL) */
    private String token;

    /** Puntuación NPS (0–10) */
    private Integer score;

    /** Comentario opcional del cliente */
    private String comment;
  }
}
