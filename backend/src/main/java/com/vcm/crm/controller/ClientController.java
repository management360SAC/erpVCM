// src/main/java/com/vcm/crm/controller/ClientController.java
package com.vcm.crm.controller;

import com.vcm.crm.dto.ClientDtos;
import com.vcm.crm.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@Validated
public class ClientController {

  private final ClientService service;

  @GetMapping
  public List<ClientDtos.ClientResponse> list() {
    return service.list();
  }

  @GetMapping("/{id}")
  public ClientDtos.ClientResponse get(@PathVariable("id") Integer id) {
    return service.get(id);
  }

  @PostMapping
  public ResponseEntity<ClientDtos.ClientResponse> create(
      @Valid @RequestBody ClientDtos.CreateClientRequest req) {
    return ResponseEntity.ok(service.create(req));
  }

  @PutMapping("/{id}")
  public ClientDtos.ClientResponse update(
      @PathVariable("id") Integer id,
      @Valid @RequestBody ClientDtos.UpdateClientRequest req) {
    return service.update(id, req);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable("id") Integer id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }
}
