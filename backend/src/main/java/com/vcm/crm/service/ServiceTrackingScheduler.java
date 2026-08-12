package com.vcm.crm.service;

import com.vcm.crm.entity.ContractedService;
import com.vcm.crm.entity.ContractedService.ServiceStatus;
import com.vcm.crm.repository.ContractedServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ServiceTrackingScheduler {

    private final ServiceTrackingService service;
    private final ContractedServiceService contractedServiceService;
    private final ContractedServiceRepository contractedServiceRepository;

    /**
     * Diario a la 1 AM hora Lima.
     * Marca automáticamente como COMPLETADO los servicios EN_EJECUCION
     * cuya end_date ya llegó o pasó.
     * Al día siguiente (9 AM), el NpsAutoInviteService envía la encuesta.
     */
    @Scheduled(cron = "0 0 1 * * ?", zone = "America/Lima")
    public void checkExpiredServices() {
        LocalDate today = LocalDate.now(ZoneId.of("America/Lima"));
        log.info("[Scheduler] Verificando servicios para auto-completar (end_date <= {})", today);

        List<ContractedService> due = contractedServiceRepository.findDueForCompletion(today);

        int completed = 0;
        for (ContractedService cs : due) {
            try {
                contractedServiceService.updateStatus(cs.getId(), ServiceStatus.COMPLETADO, cs.getEndDate());
                log.info("[Scheduler] Servicio {} marcado como COMPLETADO automáticamente", cs.getNumber());
                completed++;
            } catch (Exception e) {
                log.error("[Scheduler] Error al completar servicio id={}: {}", cs.getId(), e.getMessage());
            }
        }

        log.info("[Scheduler] Auto-completados: {} servicios", completed);
    }
}
