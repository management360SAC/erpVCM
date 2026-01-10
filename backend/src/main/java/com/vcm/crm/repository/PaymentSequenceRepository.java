package com.vcm.crm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.vcm.crm.entity.PaymentSequence;

public interface PaymentSequenceRepository extends JpaRepository<PaymentSequence, Integer> {
}