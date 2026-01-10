package com.vcm.crm.domain.quote;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "quote_items")
public class QuoteItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // Relación con Quote
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "quote_id", nullable = false)
  private Quote quote;

  @Column(name = "service_id")
  private Long serviceId;

  @Column(nullable = false, length = 255)
  private String name;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal cost = BigDecimal.ZERO;

  @Column(name = "created_at", nullable = false, updatable = false)
  private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
}
