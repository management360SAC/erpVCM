package com.vcm.crm.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "manual_projections",
    uniqueConstraints = @UniqueConstraint(columnNames = {"org_id", "year_val", "month_val"}))
@Getter
@Setter
public class ManualProjection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false)
    private Integer orgId;

    // year_val / month_val para evitar palabras reservadas de MySQL
    @Column(name = "year_val", nullable = false)
    private Integer year;

    @Column(name = "month_val")
    private Integer month; // 1-12; null = proyección anual

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
