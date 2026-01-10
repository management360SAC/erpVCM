// src/main/java/com/vcm/crm/repository/DealRepository.java
package com.vcm.crm.repository;

import com.vcm.crm.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DealRepository extends JpaRepository<Deal, Long> {

    List<Deal> findByOrgIdAndStatus(Integer orgId, String status);
}
