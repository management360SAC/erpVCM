package com.vcm.crm.repository;

import com.vcm.crm.entity.MetaIntegration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MetaIntegrationRepository extends JpaRepository<MetaIntegration, Integer> {
    Optional<MetaIntegration> findTopByOrgIdOrderByIdAsc(Integer orgId);
    Optional<MetaIntegration> findByVerifyToken(String verifyToken);
    Optional<MetaIntegration> findByPageId(String pageId);
}
