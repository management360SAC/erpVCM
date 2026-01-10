package com.vcm.crm.entity;

import javax.persistence.*;

@Entity
@Table(name = "payment_sequences")
public class PaymentSequence {

  @Id
  private Integer year;

  private Integer lastNumber;

  public PaymentSequence() {}

  public PaymentSequence(Integer year, Integer lastNumber) {
    this.year = year;
    this.lastNumber = lastNumber;
  }

  // ===== Getters & Setters =====
  public Integer getYear() { return year; }
  public void setYear(Integer year) { this.year = year; }

  public Integer getLastNumber() { return lastNumber; }
  public void setLastNumber(Integer lastNumber) { this.lastNumber = lastNumber; }
}
