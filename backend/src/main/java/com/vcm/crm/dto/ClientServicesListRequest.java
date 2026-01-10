// src/main/java/com/vcm/crm/dto/ClientServicesListRequest.java
package com.vcm.crm.dto;

public class ClientServicesListRequest {
  private Integer clientId;
  private Boolean onlyActive;
  public ClientServicesListRequest() {}
  public ClientServicesListRequest(Integer clientId, Boolean onlyActive){ this.clientId=clientId; this.onlyActive=onlyActive; }
  public Integer getClientId(){ return clientId; }
  public Boolean getOnlyActive(){ return onlyActive; }
}