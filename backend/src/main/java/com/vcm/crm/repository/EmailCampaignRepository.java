package com.vcm.crm.repository;

import com.vcm.crm.entity.EmailCampaign;
import com.vcm.crm.entity.EmailCampaignStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, Long> {

    List<EmailCampaign> findByOrgId(Integer orgId);

    List<EmailCampaign> findByOrgIdOrderByCreatedAtDesc(Integer orgId);  // ← Agrega esta línea

    List<EmailCampaign> findByStatusAndScheduledAtLessThanEqual(EmailCampaignStatus status, LocalDateTime cutoff);

}