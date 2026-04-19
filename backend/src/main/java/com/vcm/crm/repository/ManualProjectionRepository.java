package com.vcm.crm.repository;

import com.vcm.crm.entity.ManualProjection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ManualProjectionRepository extends JpaRepository<ManualProjection, Long> {

    List<ManualProjection> findByOrgIdAndYearOrderByMonthAsc(Integer orgId, Integer year);

    Optional<ManualProjection> findByOrgIdAndYearAndMonth(Integer orgId, Integer year, Integer month);
}
