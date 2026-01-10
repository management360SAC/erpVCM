package com.vcm.crm.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;  // ✅ AGREGADO
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j  // ✅ AGREGADO: Esto genera el logger "log"
@Component
@RequiredArgsConstructor
public class ServiceTrackingScheduler {

    private final ServiceTrackingService service;

    @Scheduled(cron = "0 0 1 * * ?") // Diario a la 1 AM
    public void checkExpiredServices() {
        log.info("Verificación de servicios expirados ejecutada");
    }
}