package com.vcm.crm.service;

import com.vcm.crm.dto.ServiceTrackingDtos.ExpiryRow;
import com.vcm.crm.dto.ServiceTrackingDtos.Summary;
import com.vcm.crm.entity.ClientService;
import com.vcm.crm.repository.ClientServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceTrackingService {

    private final ClientServiceRepository clientServiceRepository;

    /** Resumen de servicios activos / por vencer / vencidos en una ventana. */
    public Summary getSummary(Integer withinDays) {
        LocalDate today = LocalDate.now();
        LocalDate cutoffDate = today.plusDays(withinDays != null ? withinDays : 30);

        List<ClientService> allActive = clientServiceRepository.findByActiveTrue();

        long totalActive = allActive.size();
        long expiringSoon = allActive.stream()
                .filter(cs -> cs.getEndDate() != null)
                .filter(cs -> {
                    LocalDate end = cs.getEndDate();
                    return !end.isBefore(today) && !end.isAfter(cutoffDate);
                })
                .count();

        long expired = allActive.stream()
                .filter(cs -> cs.getEndDate() != null && cs.getEndDate().isBefore(today))
                .count();

        Summary s = new Summary();
        s.setTotalActive(totalActive);
        s.setExpiringSoon(expiringSoon);
        s.setExpired(expired);
        s.setWindowDays(withinDays != null ? withinDays : 30);
        return s;
    }

    /** Servicios que expiran en los próximos N días */
    public List<ExpiryRow> findExpiring(Integer withinDays) {
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(withinDays);

        return clientServiceRepository
                .findByEndDateBetweenAndActiveTrue(today, futureDate)
                .stream()
                .map(cs -> toExpiryRow(cs, withinDays, today))
                .collect(Collectors.toList());
    }

    /** Servicios ya expirados (end_date < hoy) */
    public List<ExpiryRow> findExpired() {
        LocalDate today = LocalDate.now();
        return clientServiceRepository
                .findByEndDateBeforeAndActiveTrue(today)
                .stream()
                .map(cs -> toExpiryRow(cs, 30, today))
                .collect(Collectors.toList());
    }

    /** Servicios activos con fin después de hoy */
    public List<ExpiryRow> findActive() {
        LocalDate today = LocalDate.now();
        return clientServiceRepository
                .findByEndDateAfterAndActiveTrue(today)
                .stream()
                .map(cs -> toExpiryRow(cs, 30, today))
                .collect(Collectors.toList());
    }

    // -------- Helpers --------
    private ExpiryRow toExpiryRow(ClientService cs, int windowDays, LocalDate today) {
        ExpiryRow row = new ExpiryRow();
        row.setClientServiceId(cs.getId().longValue());
        row.setClientId(cs.getClient().getId().longValue());
        row.setClientName(cs.getClient().getLegalName());
        row.setServiceId(cs.getService().getId().longValue());
        row.setServiceName(cs.getService().getName());
        row.setStartDate(cs.getStartDate());
        row.setEndDate(cs.getEndDate());
        row.setActive(Boolean.TRUE.equals(cs.getActive()));

        long daysRemaining;
        String severity;

        if (cs.getEndDate() == null) {
            daysRemaining = 9999;
            severity = "OK";
        } else if (cs.getEndDate().isBefore(today)) {
            daysRemaining = 0;
            severity = "EXPIRED";
        } else {
            daysRemaining = ChronoUnit.DAYS.between(today, cs.getEndDate());
            if (daysRemaining <= 7) severity = "CRITICAL";
            else if (daysRemaining <= windowDays) severity = "WARN";
            else severity = "OK";
        }

        row.setDaysRemaining(daysRemaining);
        row.setSeverity(severity);
        return row;
    }
}
