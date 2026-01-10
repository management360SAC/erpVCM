package com.vcm.crm.service;

import com.vcm.crm.dto.ClientServiceDTO;
import com.vcm.crm.entity.Client;
import com.vcm.crm.entity.ClientService;
import com.vcm.crm.entity.ServiceCatalog;
import com.vcm.crm.repository.ClientRepository;
import com.vcm.crm.repository.ClientServiceRepository;
import com.vcm.crm.repository.ServiceCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ClientServiceService {

  private final ClientServiceRepository repo;
  private final ClientRepository clientRepo;
  private final ServiceCatalogRepository serviceRepo;

  public List<ClientServiceDTO> listByClient(Integer clientId, Boolean onlyActive) {
    List<ClientService> list = repo.findByClient_Id(clientId);
    List<ClientServiceDTO> out = new ArrayList<>();
    for (ClientService cs : list) {
      if (Boolean.TRUE.equals(onlyActive) && !Boolean.TRUE.equals(cs.getActive())) continue;
      out.add(toDto(cs));
    }
    return out;
  }

  @Transactional
  public ClientServiceDTO attach(Integer clientId, Integer serviceId, ClientServiceDTO body) {
    Client client = clientRepo.findById(clientId)
        .orElseThrow(() -> new NoSuchElementException("Cliente no existe: " + clientId));
    ServiceCatalog svc = serviceRepo.findById(serviceId)
        .orElseThrow(() -> new NoSuchElementException("Servicio no existe: " + serviceId));

    if (repo.existsByClient_IdAndService_Id(clientId, serviceId)) {
      throw new IllegalStateException("El cliente ya tiene ese servicio.");
    }

    ClientService cs = new ClientService();
    cs.setClient(client);
    cs.setService(svc);
    cs.setActive(body.getActive() == null ? true : body.getActive());
    cs.setPrice(body.getPrice());                 // ✅ usar la columna real "price"
    cs.setStartDate(body.getStartDate());
    cs.setEndDate(body.getEndDate());
    cs.setNotes(body.getNotes());

    cs = repo.save(cs);
    return toDto(cs);
  }

  @Transactional
  public void detach(Integer clientId, Integer serviceId) {
    repo.deleteByClient_IdAndService_Id(clientId, serviceId);
  }

  @Transactional
  public ClientServiceDTO update(Integer clientServiceId, ClientServiceDTO body) {
    ClientService cs = repo.findById(clientServiceId)
        .orElseThrow(() -> new NoSuchElementException("ClientService no existe: " + clientServiceId));

    if (body.getActive() != null) cs.setActive(body.getActive());
    if (body.getPrice()  != null) cs.setPrice(body.getPrice());   // ✅ price
    if (body.getStartDate() != null) cs.setStartDate(body.getStartDate());
    if (body.getEndDate()   != null) cs.setEndDate(body.getEndDate());
    if (body.getNotes()     != null) cs.setNotes(body.getNotes());

    cs = repo.save(cs);
    return toDto(cs);
  }

  private ClientServiceDTO toDto(ClientService cs) {
    ClientServiceDTO dto = new ClientServiceDTO();
    dto.setId(cs.getId());
    dto.setClientId(cs.getClient().getId());
    dto.setServiceId(cs.getService().getId());

    // Datos del catálogo (existen en tu entidad ServiceCatalog)
    dto.setServiceName(cs.getService().getName());
    dto.setBillingModel(cs.getService().getBillingModel());
    dto.setBasePrice(cs.getService().getBasePrice());

    dto.setStartDate(cs.getStartDate());
    dto.setEndDate(cs.getEndDate());
    dto.setActive(Boolean.TRUE.equals(cs.getActive()));
    dto.setPrice(cs.getPrice());                  // ✅ price
    dto.setNotes(cs.getNotes());
    return dto;
  }
}
