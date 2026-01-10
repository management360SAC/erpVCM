package com.vcm.crm.repository;

import com.vcm.crm.entity.Reminder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Integer> {
    
    Page<Reminder> findByIsActive(Boolean isActive, Pageable pageable);
}