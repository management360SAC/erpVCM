package com.vcm.crm.service;

import com.vcm.crm.dto.RoleDTO;
import com.vcm.crm.entity.Role;
import com.vcm.crm.repository.RoleRepository;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleServiceImpl implements RoleService {

  private final RoleRepository repo;

  public RoleServiceImpl(RoleRepository repo) {
    this.repo = repo;
  }

  @Override
  public List<RoleDTO> list(Integer orgId) {
    List<Role> list = (orgId != null)
        ? repo.findByOrgIdOrderByNameAsc(orgId)
        : repo.findAll();
    return list.stream().map(this::toDto).collect(Collectors.toList());
  }

  @Override
  public RoleDTO get(Integer id) {
    Role e = repo.findById(id)
        .orElseThrow(() -> new RuntimeException("Role not found: " + id));
    return toDto(e);
  }

  @Override
  @Transactional
  public RoleDTO create(RoleDTO d) {
    if (d == null) throw new IllegalArgumentException("Body is required");
    Role e = new Role();
    copy(d, e);
    if (e.getIsActive() == null) e.setIsActive(true);
    return toDto(repo.save(e));
  }

  @Override
  @Transactional
  public RoleDTO update(Integer id, RoleDTO d) {
    if (d == null) throw new IllegalArgumentException("Body is required");
    Role e = repo.findById(id)
        .orElseThrow(() -> new RuntimeException("Role not found: " + id));
    copy(d, e);
    return toDto(repo.save(e));
  }

  @Override
  @Transactional
  public void softDelete(Integer id) {
    Role e = repo.findById(id)
        .orElseThrow(() -> new RuntimeException("Role not found: " + id));
    e.setIsActive(false);
    repo.save(e);
  }

  /* ----------------- helpers ----------------- */

  private RoleDTO toDto(Role e) {
    RoleDTO d = new RoleDTO();
    d.setId(e.getId());
    d.setOrgId(e.getOrgId());
    d.setName(e.getName());
    d.setDescription(e.getDescription());
    d.setIsActive(e.getIsActive());
    return d;
  }

  private void copy(RoleDTO d, Role e) {
    if (d.getOrgId() != null) e.setOrgId(d.getOrgId());
    if (d.getName() != null) e.setName(d.getName());
    e.setDescription(d.getDescription()); // puede ser null
    if (d.getIsActive() != null) e.setIsActive(d.getIsActive());
  }
}
