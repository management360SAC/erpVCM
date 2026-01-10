package com.vcm.crm.controller;

import com.vcm.crm.dto.RoleDTO;
import com.vcm.crm.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

  private final RoleService service;

  public RoleController(RoleService service) {
    this.service = service;
  }

  // GET /api/roles?orgId=1
  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public List<RoleDTO> list(@RequestParam(required = false) Integer orgId) {
    return service.list(orgId);
  }

  // GET /api/roles/{id}
  @GetMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public RoleDTO get(@PathVariable Integer id) {
    return service.get(id);
  }

  // POST /api/roles
  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<RoleDTO> create(@Valid @RequestBody RoleDTO dto) {
    RoleDTO created = service.create(dto);
    return ResponseEntity
        .created(URI.create("/api/roles/" + created.getId()))
        .body(created);
  }

  // PUT /api/roles/{id}
  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public RoleDTO update(@PathVariable Integer id,
                        @Valid @RequestBody RoleDTO dto) {
    return service.update(id, dto);
  }

  // DELETE /api/roles/{id}  (borrado lógico => is_active=false)
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> delete(@PathVariable Integer id) {
    service.softDelete(id);
    return ResponseEntity.noContent().build();
  }
}
