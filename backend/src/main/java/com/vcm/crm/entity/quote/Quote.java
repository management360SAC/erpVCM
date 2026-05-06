package com.vcm.crm.domain.quote;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "quotes")
public class Quote {
  
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  
  @Column(name="org_id", nullable=false)
  private Integer orgId;
  
  @Column(nullable=false, length=20, unique=true)
  private String number;
  
  @Column(name="client_id")
  private Long clientId;
  
  @Column(nullable=false, length=10)
  private String sector; // PRIVADO|PUBLICO
  
  @Enumerated(EnumType.STRING)
  @Column(nullable=false, length=10)
  private QuoteStatus status = QuoteStatus.BORRADOR;
  
  @Column(name="sub_total", precision=12, scale=2, nullable=false)
  private BigDecimal subTotal = BigDecimal.ZERO;
  
  @Column(precision=12, scale=2, nullable=false)
  private BigDecimal igv = BigDecimal.ZERO;
  
  @Column(precision=12, scale=2, nullable=false)
  private BigDecimal total = BigDecimal.ZERO;
  
  @Column(name="email_to", length=200)
  private String emailTo;
  
  @Column(name="file_url", length=500)
  private String fileUrl;
  
  @Column(name="file_size")
  private Long fileSize;
  
  @Column(name="valid_until")
  private LocalDate validUntil;
  
  @Column(length=1000)
  private String notes;
  
  @Column(name="created_by")
  private Long createdBy;
  
  @Column(name="created_at", nullable=false, updatable=false)
  private LocalDateTime createdAt = LocalDateTime.now();
  
  @Column(name="updated_at")
  private LocalDateTime updatedAt;
  
  // ✨ NUEVA RELACIÓN: Items de la cotización
  @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
  private List<QuoteItem> items = new ArrayList<>();
  
  // ✅ Cinturón de seguridad: evita inserts con nulos
  @PrePersist
  void ensureDefaults() {
    if (orgId == null) orgId = 1;
    if (sector == null) sector = "PRIVADO";
    if (subTotal == null) subTotal = BigDecimal.ZERO;
    if (igv == null) igv = BigDecimal.ZERO;
    if (total == null) total = BigDecimal.ZERO;
  }
}