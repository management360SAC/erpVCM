package com.vcm.crm.entity;

import lombok.*;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name = "lead_forms")
@Data @NoArgsConstructor @AllArgsConstructor
public class LeadForm {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  private String name;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(name = "is_active")
  private Boolean active = Boolean.TRUE;

  @Column(name = "created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;
}
