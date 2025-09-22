package com.vcm.crm.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

public class UserDtos {

  @Data
  public static class CreateUserRequest {
    private Integer orgId;
    private String username;
    private String password;
    private String nombre;
    private String rol;
    private String email;
    private String direccion;
    private String celular;
    private Boolean isActive;
  }

  @Data
  public static class UpdateUserRequest {
    private String nombre;
    private String rol;
    private String email;
    private String direccion;
    private String celular;
    private Boolean isActive;
    private String newPassword;
  }

  @Data
  @Builder
  @NoArgsConstructor       // ⬅️ NECESARIO para poder usar new UserResponse()
  @AllArgsConstructor      // (opcional, útil si quieres el constructor completo)
  public static class UserResponse {
    private Integer id;
    private Integer orgId;
    private String username;
    private String nombre;
    private String rol;
    private String email;
    private String direccion;
    private String celular;
    private Boolean isActive;
  }
}
