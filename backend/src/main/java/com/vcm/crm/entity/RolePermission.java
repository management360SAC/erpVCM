package com.vcm.crm.entity;

import javax.persistence.*;

@Entity
@Table(name = "role_permission")
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "role_id", nullable = false)
    private Integer roleId;

    @Column(nullable = false, length = 60)
    private String permission;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getRoleId() { return roleId; }
    public void setRoleId(Integer roleId) { this.roleId = roleId; }

    public String getPermission() { return permission; }
    public void setPermission(String permission) { this.permission = permission; }
}
