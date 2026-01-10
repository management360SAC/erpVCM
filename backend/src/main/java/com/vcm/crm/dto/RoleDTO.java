package com.vcm.crm.dto;

public class RoleDTO {
  private Integer id;
  private Integer orgId;
  private String name;
  private String description;
  private Boolean isActive;

  public Integer getId() { return id; }
  public void setId(Integer id) { this.id = id; }
  public Integer getOrgId() { return orgId; }
  public void setOrgId(Integer orgId) { this.orgId = orgId; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public Boolean getIsActive() { return isActive; }
  public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
