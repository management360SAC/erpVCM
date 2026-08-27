package com.vcm.crm.controller;

import com.vcm.crm.dto.RoleDTO;
import com.vcm.crm.entity.RolePermission;
import com.vcm.crm.repository.RolePermissionRepository;
import com.vcm.crm.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

  private final RoleService service;
  private final RolePermissionRepository rolePermissionRepo;

  public RoleController(RoleService service, RolePermissionRepository rolePermissionRepo) {
    this.service = service;
    this.rolePermissionRepo = rolePermissionRepo;
  }

  /**
   * GET/PUT de permisos por rol. IMPORTANTE: esto persiste la selección de la
   * pantalla "Permisos del Rol", pero por ahora es solo de lectura/escritura de
   * datos — el sistema de autorización real (@PreAuthorize) sigue basado en
   * hasRole(...) por ROL, no en estos permisos finos (UserDetailsServiceImpl
   * solo otorga ROLE_<rol>, nunca estas autoridades). Antes de anunciar esta
   * pantalla como control de acceso real, falta cablear estos permisos dentro
   * de UserDetailsServiceImpl y usarlos en los @PreAuthorize de cada endpoint.
   */
  @GetMapping("/{id}/permissions")
  @PreAuthorize("hasRole('ADMIN')")
  public List<String> getPermissions(@PathVariable Integer id) {
    return rolePermissionRepo.findByRoleId(id).stream()
        .map(RolePermission::getPermission)
        .collect(Collectors.toList());
  }

  @PutMapping("/{id}/permissions")
  @PreAuthorize("hasRole('ADMIN')")
  public List<String> updatePermissions(@PathVariable Integer id, @RequestBody List<String> permissions) {
    rolePermissionRepo.deleteByRoleId(id);
    List<String> toSave = permissions != null ? permissions : java.util.Collections.emptyList();
    for (String p : toSave) {
      if (p == null || p.trim().isEmpty()) continue;
      RolePermission rp = new RolePermission();
      rp.setRoleId(id);
      rp.setPermission(p.trim());
      rolePermissionRepo.save(rp);
    }
    return getPermissions(id);
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
