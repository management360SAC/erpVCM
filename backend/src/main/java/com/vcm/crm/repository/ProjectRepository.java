package com.vcm.crm.repository;

import com.vcm.crm.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query(
        "SELECT p FROM Project p " +
        "WHERE p.orgId = :orgId " +
        "AND (:text IS NULL OR :text = '' " +
        "     OR LOWER(p.code) LIKE LOWER(CONCAT('%', :text, '%')) " +
        "     OR LOWER(p.name) LIKE LOWER(CONCAT('%', :text, '%')) " +
        "     OR LOWER(p.ownerName) LIKE LOWER(CONCAT('%', :text, '%')) " +
        "     OR LOWER(p.client.legalName) LIKE LOWER(CONCAT('%', :text, '%'))) " +
        "AND (:status IS NULL OR :status = '' OR p.status = :status)"
    )
    Page<Project> search(
        @Param("orgId") Integer orgId,
        @Param("text") String text,
        @Param("status") String status,
        Pageable pageable
    );
}
