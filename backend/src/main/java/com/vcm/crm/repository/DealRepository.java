// src/main/java/com/vcm/crm/repository/DealRepository.java
package com.vcm.crm.repository;

import com.vcm.crm.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DealRepository extends JpaRepository<Deal, Long> {

    List<Deal> findByOrgIdAndStatus(Integer orgId, String status);

    List<Deal> findByOrgId(Integer orgId);

    Optional<Deal> findFirstByOrgIdAndClient_IdAndStatus(Integer orgId, Integer clientId, String status);
}
