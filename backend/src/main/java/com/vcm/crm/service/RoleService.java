package com.vcm.crm.service;

import com.vcm.crm.dto.RoleDTO;
import java.util.List;

public interface RoleService {
  List<RoleDTO> list(Integer orgId);
  RoleDTO get(Integer id);
  RoleDTO create(RoleDTO d);
  RoleDTO update(Integer id, RoleDTO d);
  void softDelete(Integer id);
}
