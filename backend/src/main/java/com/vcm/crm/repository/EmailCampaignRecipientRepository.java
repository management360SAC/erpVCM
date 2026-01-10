package com.vcm.crm.repository;

import com.vcm.crm.entity.EmailCampaignRecipient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailCampaignRecipientRepository extends JpaRepository<EmailCampaignRecipient, Long> {
}
