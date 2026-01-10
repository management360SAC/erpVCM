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
