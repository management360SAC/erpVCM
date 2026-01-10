package com.vcm.crm.service;

import com.vcm.crm.entity.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertService {

    Page<Alert> listAlerts(Boolean activo, Boolean leido, Integer userId, Pageable pageable);

    Page<Alert> listUnread(Pageable pageable);

    Page<Alert> listUserAlerts(Integer userId, Pageable pageable);

    List<Alert> findPending(LocalDateTime now);

    Page<Alert> findPending(LocalDateTime now, Pageable pageable);

    long countPendingByUser(Integer userId, LocalDateTime now);

    Alert getById(Long id);

    Alert create(Alert alert);

    Alert update(Long id, Alert alert);

    Alert markAsRead(Long id);

    void delete(Long id);
}
