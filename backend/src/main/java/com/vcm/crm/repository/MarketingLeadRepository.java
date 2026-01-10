// src/main/java/com/vcm/crm/repository/MarketingLeadRepository.java
package com.vcm.crm.repository;

import com.vcm.crm.entity.MarketingLead;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketingLeadRepository extends JpaRepository<MarketingLead, Long> {
}
