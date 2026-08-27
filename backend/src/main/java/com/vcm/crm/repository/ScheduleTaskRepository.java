package com.vcm.crm.repository;

import com.vcm.crm.entity.ScheduleTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleTaskRepository extends JpaRepository<ScheduleTask, Long> {
    List<ScheduleTask> findByScheduleIdOrderBySortOrderAsc(Long scheduleId);
}
