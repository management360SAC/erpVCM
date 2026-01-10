package com.vcm.crm.repository;

import com.vcm.crm.entity.LeadForm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeadFormRepository extends JpaRepository<LeadForm, Integer> {
  Optional<LeadForm> findBySlugAndActiveTrue(String slug);
}
