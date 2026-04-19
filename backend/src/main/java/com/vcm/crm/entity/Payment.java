package com.vcm.crm.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 50)
  private String number; // PAY-YYYY-0001

  @Column(nullable = false)
  private Long invoiceId;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal amount;

  @Column(nullable = false, length = 30)
  private String method;

  @Column(length = 100)
  private String refCode;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(nullable = false)
  private LocalDateTime paidAt;

  @Column(length = 255)
  private String fileName;

  @Column(length = 1024)
  private String filePath;

  private Long fileSize;

  @Column(length = 100)
  private String contentType;

  private Long createdBy;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  /** VALIDO (por defecto) | CORREGIDO | ANULADO */
  @Column(nullable = false, length = 20)
  private String status = "VALIDO";

  /** ID del pago original que este registro corrige (null si no es corrección) */
  @Column
  private Long correctionOf;

  /** Motivo ingresado al corregir un pago */
  @Column(columnDefinition = "TEXT")
  private String correctionReason;

  public Payment() {}

  // ===== Getters & Setters =====
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getNumber() { return number; }
  public void setNumber(String number) { this.number = number; }

  public Long getInvoiceId() { return invoiceId; }
  public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }

  public BigDecimal getAmount() { return amount; }
  public void setAmount(BigDecimal amount) { this.amount = amount; }

  public String getMethod() { return method; }
  public void setMethod(String method) { this.method = method; }

  public String getRefCode() { return refCode; }
  public void setRefCode(String refCode) { this.refCode = refCode; }

  public String getNotes() { return notes; }
  public void setNotes(String notes) { this.notes = notes; }

  public LocalDateTime getPaidAt() { return paidAt; }
  public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

  public String getFileName() { return fileName; }
  public void setFileName(String fileName) { this.fileName = fileName; }

  public String getFilePath() { return filePath; }
  public void setFilePath(String filePath) { this.filePath = filePath; }

  public Long getFileSize() { return fileSize; }
  public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

  public String getContentType() { return contentType; }
  public void setContentType(String contentType) { this.contentType = contentType; }

  public Long getCreatedBy() { return createdBy; }
  public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }

  public Long getCorrectionOf() { return correctionOf; }
  public void setCorrectionOf(Long correctionOf) { this.correctionOf = correctionOf; }

  public String getCorrectionReason() { return correctionReason; }
  public void setCorrectionReason(String correctionReason) { this.correctionReason = correctionReason; }
}
