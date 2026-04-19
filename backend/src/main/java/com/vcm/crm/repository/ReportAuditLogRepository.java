package com.vcm.crm.repository;

import com.vcm.crm.entity.ReportAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportAuditLogRepository extends JpaRepository<ReportAuditLog, Long> {
    Page<ReportAuditLog> findByOrgIdOrderByCreatedAtDesc(Integer orgId, Pageable pageable);
}
