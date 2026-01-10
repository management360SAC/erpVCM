package com.vcm.crm.repository;

import com.vcm.crm.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoleRepository extends JpaRepository<Role, Integer> {
  List<Role> findByOrgIdOrderByNameAsc(Integer orgId);
  boolean existsByOrgIdAndName(Integer orgId, String name);
}
