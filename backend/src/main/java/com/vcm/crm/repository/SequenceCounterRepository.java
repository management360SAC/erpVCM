package com.vcm.crm.repository;

import com.vcm.crm.entity.SequenceCounter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SequenceCounterRepository extends JpaRepository<SequenceCounter, String> {
}
