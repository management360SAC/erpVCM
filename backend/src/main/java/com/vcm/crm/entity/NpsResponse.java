// src/main/java/com/vcm/crm/entity/NpsResponse.java
package com.vcm.crm.entity;

import lombok.*;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nps_responses")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class NpsResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // FK a client_service.id
    @ManyToOne(optional = false)
    @JoinColumn(name = "client_service_id", nullable = false)
    private ClientService clientService;

    // Pregunta 1: Calidad general del servicio (1-5)
    @Column(name = "q1")
    private Integer q1;

    // Pregunta 2: Comunicación y atención del equipo (1-5)
    @Column(name = "q2")
    private Integer q2;

    // Pregunta 3: Cumplimiento de plazos (1-5)
    @Column(name = "q3")
    private Integer q3;

    // Pregunta 4: Satisfacción con los resultados (1-5)
    @Column(name = "q4")
    private Integer q4;

    // Pregunta 5 / NPS: Probabilidad de recomendación (0-10)
    @Column(nullable = false)
    private Integer score;

    @Column(columnDefinition = "text")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
