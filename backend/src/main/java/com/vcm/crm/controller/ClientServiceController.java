package com.vcm.crm.controller;

import com.vcm.crm.dto.ClientServiceDTO;
import com.vcm.crm.service.ClientServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.vcm.crm.dto.ClientServicesListRequest;  
import java.util.List;

@RestController
@RequestMapping("/api/client-services")  // ← Cambiado aquí
@RequiredArgsConstructor
public class ClientServiceController {

  private final ClientServiceService svc;

  @GetMapping("/{clientId}")
  public List<ClientServiceDTO> list(@PathVariable Integer clientId,
                                     @RequestParam(required = false) Boolean onlyActive) {
    return svc.listByClient(clientId, onlyActive);
  }

  @PostMapping("/{clientId}/{serviceId}")
  public ClientServiceDTO attach(@PathVariable Integer clientId,
                                 @PathVariable Integer serviceId,
                                 @RequestBody ClientServiceDTO body) {
    return svc.attach(clientId, serviceId, body);
  }

  @DeleteMapping("/{clientId}/{serviceId}")
  public void detach(@PathVariable Integer clientId, @PathVariable Integer serviceId) {
    svc.detach(clientId, serviceId);
  }

  @PatchMapping("/{clientServiceId}")
  public ClientServiceDTO update(@PathVariable Integer clientServiceId,
                                 @RequestBody ClientServiceDTO body) {
    return svc.update(clientServiceId, body);
  }

  @PostMapping("/list")
  public List<ClientServiceDTO> listPost(@RequestBody ClientServicesListRequest req) {
    return svc.listByClient(req.getClientId(), req.getOnlyActive());
  }
}