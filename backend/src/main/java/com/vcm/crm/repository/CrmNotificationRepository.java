// src/main/java/com/vcm/crm/repository/CrmNotificationRepository.java
package com.vcm.crm.repository;

import com.vcm.crm.entity.CrmNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CrmNotificationRepository extends JpaRepository<CrmNotification, Long> {

    List<CrmNotification> findByDealIdAndTypeAndStatus(Long dealId, String type, String status);
}
