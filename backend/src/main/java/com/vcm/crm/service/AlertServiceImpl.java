package com.vcm.crm.service.impl;

import com.vcm.crm.entity.Alert;
import com.vcm.crm.repository.AlertRepository;
import com.vcm.crm.service.AlertService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepository;

    public AlertServiceImpl(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @Override
    public Page<Alert> listAlerts(Boolean activo, Boolean leido, Integer userId, Pageable pageable) {
        // Usa tu query dinámica
        return alertRepository.findWithFilters(activo, leido, userId, pageable);
    }

    @Override
    public Page<Alert> listUnread(Pageable pageable) {
        return alertRepository.findByReadAtIsNull(pageable);
        // o alertRepository.findUnread(pageable);
    }

    @Override
    public Page<Alert> listUserAlerts(Integer userId, Pageable pageable) {
        return alertRepository.findByUserId(userId, pageable);
    }

    @Override
    public List<Alert> findPending(LocalDateTime now) {
        return alertRepository.findPendingAlerts(now);
    }

    @Override
    public Page<Alert> findPending(LocalDateTime now, Pageable pageable) {
        return alertRepository.findPendingAlerts(now, pageable);
    }

    @Override
    public long countPendingByUser(Integer userId, LocalDateTime now) {
        return alertRepository.countPendingByUser(userId, now);
    }

    @Override
    public Alert getById(Long id) {
        return alertRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Alerta no encontrada con id " + id));
    }

    @Override
    public Alert create(Alert alert) {
        // Puedes setear valores por defecto aquí
        alert.setId(null);
        if (alert.getActivo() == null) {
            alert.setActivo(true);
        }
        if (alert.getCreatedAt() == null) {
            alert.setCreatedAt(LocalDateTime.now());
        }
        return alertRepository.save(alert);
    }

    @Override
    public Alert update(Long id, Alert alert) {
        Alert existing = getById(id);

        // Actualiza solo lo que necesites
        existing.setTitle(alert.getTitle());
        existing.setMessage(alert.getMessage());
        existing.setActivo(alert.getActivo());
        existing.setProximaEjecucion(alert.getProximaEjecucion());
        existing.setRepeticion(alert.getRepeticion());
        existing.setCanal(alert.getCanal());
        existing.setEntidadTipo(alert.getEntidadTipo());
        existing.setEntidadId(alert.getEntidadId());
        existing.setUserId(alert.getUserId());
        existing.setUpdatedAt(LocalDateTime.now());

        return alertRepository.save(existing);
    }

    @Override
    public Alert markAsRead(Long id) {
        Alert alert = getById(id);
        if (alert.getReadAt() == null) {
            alert.setReadAt(LocalDateTime.now());
        }
        alert.setUpdatedAt(LocalDateTime.now());
        return alertRepository.save(alert);
    }

    @Override
    public void delete(Long id) {
        if (!alertRepository.existsById(id)) {
            throw new EntityNotFoundException("Alerta no encontrada con id " + id);
        }
        alertRepository.deleteById(id);
    }
}
