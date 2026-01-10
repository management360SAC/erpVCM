// src/main/java/com/vcm/crm/service/ContractedServiceService.java
package com.vcm.crm.service;

import com.vcm.crm.dto.ContractedServiceDTO;
import com.vcm.crm.dto.ContractedServiceItemDTO;
import com.vcm.crm.dto.CreateContractedServiceRequest;
import com.vcm.crm.entity.ContractedService;
import com.vcm.crm.entity.ContractedService.ServiceStatus;
import com.vcm.crm.entity.ContractedService.BillingStatus;
import com.vcm.crm.entity.ContractedService.CollectionStatus;
import com.vcm.crm.entity.ContractedServiceItem;
import com.vcm.crm.entity.ClientService;
import com.vcm.crm.repository.ContractedServiceRepository;
import com.vcm.crm.repository.ContractedServiceItemRepository;
import com.vcm.crm.repository.ClientServiceRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContractedServiceService {

    @Autowired private ContractedServiceRepository contractedServiceRepository;
    @Autowired private ContractedServiceItemRepository itemRepository;
    @Autowired private ClientServiceRepository clientServiceRepository;

    /** Listado con filtros */
    public Page<ContractedServiceDTO> listContractedServices(
            Long orgId, ServiceStatus status, String query, Pageable pageable) {

        Page<ContractedService> page;
        if (query != null && !query.trim().isEmpty()) {
            page = contractedServiceRepository.searchByOrgId(orgId, query.trim(), pageable);
        } else if (status != null) {
            page = contractedServiceRepository.findByOrgIdAndStatus(orgId, status, pageable);
        } else {
            page = contractedServiceRepository.findByOrgId(orgId, pageable);
        }
        return page.map(this::toDTO);
    }

    /** Detalle */
    public ContractedServiceDTO getById(Long id) {
        ContractedService service = contractedServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Servicio contratado no encontrado"));
        ContractedServiceDTO dto = toDTO(service);
        dto.setItems(getItems(id));
        return dto;
    }

    /** Crear (al aprobar cotización) */
    @Transactional
    public ContractedServiceDTO createContractedService(
            CreateContractedServiceRequest request, Long orgId, Long userId) {

        if (request.getQuoteId() != null) {
            contractedServiceRepository.findByQuoteId(request.getQuoteId())
                    .ifPresent(s -> { throw new RuntimeException("Ya existe un servicio contratado para esta cotización"); });
        }

        ContractedService service = new ContractedService();
        service.setNumber(generateNumber(orgId));
        service.setQuoteId(request.getQuoteId());
        service.setClientId(request.getClientId());
        service.setOrgId(orgId);

        service.setStatus(request.getStatus() != null ? request.getStatus() : ServiceStatus.PENDIENTE);
        service.setBillingStatus(BillingStatus.NO_FACTURADO);
        service.setCollectionStatus(CollectionStatus.PENDIENTE_COBRO);

        service.setSubTotal(request.getSubTotal());
        service.setIgv(request.getIgv());
        service.setTotal(request.getTotal());
        service.setContractDate(request.getContractDate());
        service.setStartDate(request.getStartDate());
        service.setEndDate(request.getEndDate());
        service.setAssignedTo(request.getAssignedTo());
        service.setNotes(request.getNotes());
        service.setCreatedBy(userId);

        service = contractedServiceRepository.save(service);

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            saveItems(service.getId(), request.getItems());
        }
        return getById(service.getId());
    }

    /** Actualizar */
    @Transactional
    public ContractedServiceDTO updateContractedService(Long id, CreateContractedServiceRequest request) {
        ContractedService service = contractedServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Servicio contratado no encontrado"));

        service.setClientId(request.getClientId());
        service.setStatus(request.getStatus());
        service.setSubTotal(request.getSubTotal());
        service.setIgv(request.getIgv());
        service.setTotal(request.getTotal());
        service.setContractDate(request.getContractDate());
        service.setStartDate(request.getStartDate());
        service.setEndDate(request.getEndDate());
        service.setAssignedTo(request.getAssignedTo());
        service.setNotes(request.getNotes());

        service = contractedServiceRepository.save(service);

        itemRepository.deleteByContractedServiceId(id);
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            saveItems(id, request.getItems());
        }
        return getById(id);
    }

    /** Eliminar */
    @Transactional
    public void deleteContractedService(Long id) {
        if (!contractedServiceRepository.existsById(id)) {
            throw new RuntimeException("Servicio contratado no encontrado");
        }
        itemRepository.deleteByContractedServiceId(id);
        contractedServiceRepository.deleteById(id);
    }

    /**
     * Cambiar estado de ejecución, recibiendo opcionalmente una fecha de fin planificada.
     * Esto también sincroniza start/end_date y active en la tabla client_service.
     */
    @Transactional
    public ContractedServiceDTO updateStatus(Long id, ServiceStatus newStatus, LocalDate requestedEndDate) {
        ContractedService cs = contractedServiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Servicio contratado no encontrado"));

        LocalDate today = LocalDate.now();

        cs.setStatus(newStatus);

        // ======== Fechas en contracted_services ========
        if (newStatus == ServiceStatus.EN_EJECUCION) {
            if (cs.getStartDate() == null) {
                cs.setStartDate(today);
            }
            if (requestedEndDate != null) {
                cs.setEndDate(requestedEndDate);
            }
        } else if (newStatus == ServiceStatus.COMPLETADO) {
            if (cs.getStartDate() == null) {
                cs.setStartDate(today);
            }
            if (cs.getEndDate() == null) {
                cs.setEndDate(requestedEndDate != null ? requestedEndDate : today);
            }
        } else if (newStatus == ServiceStatus.CANCELADO) {
            if (cs.getEndDate() == null) {
                cs.setEndDate(requestedEndDate != null ? requestedEndDate : today);
            }
        }

        contractedServiceRepository.save(cs);

        // ======== Sincronización con client_service ========
        if (cs.getClientId() != null) {
            Integer clientIdInt = cs.getClientId().intValue();
            List<ContractedServiceItem> items = itemRepository.findByContractedServiceId(id);

            for (ContractedServiceItem it : items) {
                if (it.getServiceId() == null) continue;
                Integer svcIdInt = it.getServiceId().intValue();

                ClientService clientSvc = clientServiceRepository
                        .findByClient_IdAndService_Id(clientIdInt, svcIdInt)
                        .orElse(null);

                if (clientSvc == null) {
                    // En tu flujo normal debería existir; si no, lo ignoramos.
                    continue;
                }

                if (newStatus == ServiceStatus.EN_EJECUCION) {
                    clientSvc.setActive(Boolean.TRUE);  // ACTIVO
                    if (clientSvc.getStartDate() == null) {
                        clientSvc.setStartDate(today);
                    }
                    if (requestedEndDate != null) {
                        clientSvc.setEndDate(requestedEndDate);
                    }
                } else if (newStatus == ServiceStatus.CANCELADO || newStatus == ServiceStatus.COMPLETADO) {
                    clientSvc.setActive(Boolean.FALSE); // INACTIVO
                    if (clientSvc.getEndDate() == null) {
                        clientSvc.setEndDate(requestedEndDate != null ? requestedEndDate : today);
                    }
                }

                clientServiceRepository.save(clientSvc);
            }
        }

        return getById(id);
    }

    /** Recalcular ejes / estados */
    @Transactional
    public ContractedServiceDTO recomputeStates(Long id) {
        ContractedService cs = contractedServiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Servicio contratado no encontrado"));

        if (cs.getStatus() == ServiceStatus.PENDIENTE && cs.getStartDate() != null) {
            cs.setStatus(ServiceStatus.EN_EJECUCION);
        }

        contractedServiceRepository.save(cs);
        return getById(id);
    }

    /** Completar si cumple condiciones (ejecución + cobro) */
    @Transactional
    public ContractedServiceDTO completeIfPossible(Long id) {
        ContractedService cs = contractedServiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Servicio contratado no encontrado"));

        if (cs.getEndDate() != null && cs.getCollectionStatus() == CollectionStatus.COBRADO) {
            cs.setStatus(ServiceStatus.COMPLETADO);
            contractedServiceRepository.save(cs);
        }
        return getById(id);
    }

    /** Items de un contratado */
    public List<ContractedServiceItemDTO> getItems(Long contractedServiceId) {
        return itemRepository.findByContractedServiceId(contractedServiceId)
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    /** Generar número SVC-YYYY-### */
    private String generateNumber(Long orgId) {
        String year = String.valueOf(Year.now().getValue());
        List<String> lastNumbers = contractedServiceRepository.findLastNumberByYear(orgId, year);
        int next = 1;
        if (!lastNumbers.isEmpty()) {
            String[] parts = lastNumbers.get(0).split("-");
            if (parts.length == 3) next = Integer.parseInt(parts[2]) + 1;
        }
        return String.format("SVC-%s-%03d", year, next);
    }

    private void saveItems(Long contractedServiceId, List<ContractedServiceItemDTO> items) {
        for (ContractedServiceItemDTO d : items) {
            ContractedServiceItem it = new ContractedServiceItem();
            it.setContractedServiceId(contractedServiceId);
            it.setServiceId(d.getServiceId());
            it.setName(d.getName());
            it.setDescription(d.getDescription());
            it.setCost(d.getCost());
            it.setQuantity(d.getQuantity() != null ? d.getQuantity() : 1);
            it.setLineTotal(d.getCost().multiply(BigDecimal.valueOf(it.getQuantity())));
            itemRepository.save(it);
        }
    }

    private ContractedServiceDTO toDTO(ContractedService s) {
        ContractedServiceDTO dto = new ContractedServiceDTO();
        dto.setId(s.getId());
        dto.setNumber(s.getNumber());
        dto.setQuoteId(s.getQuoteId());
        dto.setClientId(s.getClientId());
        dto.setOrgId(s.getOrgId());
        dto.setStatus(s.getStatus());
        dto.setBillingStatus(s.getBillingStatus());
        dto.setCollectionStatus(s.getCollectionStatus());
        dto.setSubTotal(s.getSubTotal());
        dto.setIgv(s.getIgv());
        dto.setTotal(s.getTotal());
        dto.setContractDate(s.getContractDate());
        dto.setStartDate(s.getStartDate());
        dto.setEndDate(s.getEndDate());
        dto.setAssignedTo(s.getAssignedTo());
        dto.setNotes(s.getNotes());
        dto.setCreatedAt(s.getCreatedAt());
        dto.setCreatedBy(s.getCreatedBy());
        dto.setUpdatedAt(s.getUpdatedAt());
        return dto;
    }

    private ContractedServiceItemDTO toItemDTO(ContractedServiceItem it) {
        ContractedServiceItemDTO dto = new ContractedServiceItemDTO();
        dto.setId(it.getId());
        dto.setContractedServiceId(it.getContractedServiceId());
        dto.setServiceId(it.getServiceId());
        dto.setName(it.getName());
        dto.setDescription(it.getDescription());
        dto.setCost(it.getCost());
        dto.setQuantity(it.getQuantity());
        dto.setLineTotal(it.getLineTotal());
        return dto;
    }
}
