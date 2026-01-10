// backend/src/main/java/com/vcm/crm/dto/UserDtos.java
package com.vcm.crm.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

public class UserDtos {

  // ================== CREATE ==================
  public static class CreateUserRequest {
    @NotNull private Integer orgId;
    @NotBlank private String username;
    @NotBlank private String name;
    @NotBlank private String email;
    @NotBlank private String password;
    private String role;
    private Boolean active;        // opcional

    // campos extra
    private String direccion;
    private String celular;
    private String dni;
    private String cargo;
    private String sexo;           // "M" | "F" | "O"
    private LocalDate fechaDeAlta;

    // getters/setters
    public Integer getOrgId() { return orgId; }
    public void setOrgId(Integer v) { orgId = v; }

    public String getUsername() { return username; }
    public void setUsername(String v) { username = v; }

    public String getName() { return name; }
    public void setName(String v) { name = v; }

    public String getEmail() { return email; }
    public void setEmail(String v) { email = v; }

    public String getPassword() { return password; }
    public void setPassword(String v) { password = v; }

    public String getRole() { return role; }
    public void setRole(String v) { role = v; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getCelular() { return celular; }
    public void setCelular(String celular) { this.celular = celular; }

    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public String getSexo() { return sexo; }
    public void setSexo(String sexo) { this.sexo = sexo; }

    public LocalDate getFechaDeAlta() { return fechaDeAlta; }
    public void setFechaDeAlta(LocalDate fechaDeAlta) { this.fechaDeAlta = fechaDeAlta; }
  }

  // ================== UPDATE ==================
  public static class UpdateUserRequest {
    private String name;
    private String email;
    private String role;
    private Boolean active;

    private String direccion;
    private String celular;
    private String dni;
    private String cargo;
    private String sexo;          // "M" | "F" | "O"
    private LocalDate fechaDeAlta;

    // getters/setters
    public String getName() { return name; }
    public void setName(String v) { name = v; }

    public String getEmail() { return email; }
    public void setEmail(String v) { email = v; }

    public String getRole() { return role; }
    public void setRole(String v) { role = v; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean v) { active = v; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getCelular() { return celular; }
    public void setCelular(String celular) { this.celular = celular; }

    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public String getSexo() { return sexo; }
    public void setSexo(String sexo) { this.sexo = sexo; }

    public LocalDate getFechaDeAlta() { return fechaDeAlta; }
    public void setFechaDeAlta(LocalDate fechaDeAlta) { this.fechaDeAlta = fechaDeAlta; }
  }

  // ================== RESPONSE ==================
  public static class UserResponse {
    private Integer id, orgId;
    private String username, name, email, role;
    private Boolean active;

    private String direccion;
    private String celular;
    private String dni;
    private String cargo;
    private String sexo;          // "M" | "F" | "O"
    private LocalDate fechaDeAlta;

    // getters/setters
    public Integer getId() { return id; }
    public void setId(Integer v) { id = v; }

    public Integer getOrgId() { return orgId; }
    public void setOrgId(Integer v) { orgId = v; }

    public String getUsername() { return username; }
    public void setUsername(String v) { username = v; }

    public String getName() { return name; }
    public void setName(String v) { name = v; }

    public String getEmail() { return email; }
    public void setEmail(String v) { email = v; }

    public String getRole() { return role; }
    public void setRole(String v) { role = v; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean v) { active = v; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String v) { direccion = v; }

    public String getCelular() { return celular; }
    public void setCelular(String v) { celular = v; }

    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public String getSexo() { return sexo; }
    public void setSexo(String sexo) { this.sexo = sexo; }

    public LocalDate getFechaDeAlta() { return fechaDeAlta; }
    public void setFechaDeAlta(LocalDate fechaDeAlta) { this.fechaDeAlta = fechaDeAlta; }
  }
}
