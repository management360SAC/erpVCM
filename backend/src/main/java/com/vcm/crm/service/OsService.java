// src/main/java/com/vcm/crm/service/OsService.java
package com.vcm.crm.service;

import com.vcm.crm.entity.ContractedService;
import com.vcm.crm.entity.ContractedService.ServiceStatus;
import com.vcm.crm.repository.ContractedServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OsService {

    private final ContractedServiceRepository csRepo;

    public OsService(ContractedServiceRepository csRepo) {
        this.csRepo = csRepo;
    }

    @Transactional
    public void createOs(Long contractedServiceId) {
        ContractedService cs = csRepo.findById(contractedServiceId)
            .orElseThrow(() -> new IllegalArgumentException("Contratado no existe"));

        if (cs.getStatus() == ServiceStatus.PENDIENTE) {
            cs.setStatus(ServiceStatus.EN_EJECUCION);
            csRepo.save(cs);
        }
        // ... crear registros complementarios de OS aquí ...
    }
}
