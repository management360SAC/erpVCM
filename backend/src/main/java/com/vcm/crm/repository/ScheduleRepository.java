package com.vcm.crm.repository;

import com.vcm.crm.entity.Schedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    @Query(
        "SELECT s FROM Schedule s " +
        "WHERE s.orgId = :orgId " +
        "AND (:text IS NULL OR :text = '' " +
        "     OR LOWER(s.code) LIKE LOWER(CONCAT('%', :text, '%')) " +
        "     OR LOWER(s.ownerName) LIKE LOWER(CONCAT('%', :text, '%')) " +
        "     OR LOWER(s.project.name) LIKE LOWER(CONCAT('%', :text, '%'))) " +
        "AND (:status IS NULL OR :status = '' OR s.status = :status)"
    )
    Page<Schedule> search(
        @Param("orgId") Integer orgId,
        @Param("text") String text,
        @Param("status") String status,
        Pageable pageable
    );
}
