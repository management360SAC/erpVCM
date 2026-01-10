package com.vcm.crm.controller;

import com.vcm.crm.dto.ServiceDtos.CreateServiceRequest;
import com.vcm.crm.dto.ServiceDtos.ServiceResponse;
import com.vcm.crm.dto.ServiceDtos.UpdateServiceRequest;
import com.vcm.crm.service.ServiceCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceCatalogController {

  private final ServiceCatalogService service;

  @GetMapping
  public ResponseEntity<List<ServiceResponse>> list() {
    return ResponseEntity.ok(service.list());
  }

  @GetMapping("/{id}")
  public ResponseEntity<ServiceResponse> get(@PathVariable Integer id) {
    return ResponseEntity.ok(service.get(id));
  }

  @PostMapping
  public ResponseEntity<ServiceResponse> create(@Valid @RequestBody CreateServiceRequest req) {
    return ResponseEntity.ok(service.create(req));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ServiceResponse> update(
      @PathVariable Integer id,
      @Valid @RequestBody UpdateServiceRequest req
  ) {
    return ResponseEntity.ok(service.update(id, req));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Integer id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }
}
