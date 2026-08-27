package com.vcm.crm.repository;

import com.vcm.crm.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Integer> {

    List<RolePermission> findByRoleId(Integer roleId);

    @Transactional
    void deleteByRoleId(Integer roleId);
}
