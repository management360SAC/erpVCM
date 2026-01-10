package com.vcm.crm.entity;

import lombok.Data;

import javax.persistence.*;
// otros imports...
import java.time.LocalDate;

@Entity
@Table(name = "usuarios") 
@Data
public class Usuario {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(name = "org_id")
  private Integer orgId;

  @Column(nullable = false, unique = true)
  private String username;

  @Column(nullable = false)
  private String password;

  private String nombre;
  private String rol;
  private String email;
  private String direccion;
  private String celular;

  @Column(name = "is_active")
  private Boolean isActive;
  private LocalDate fechaDeAlta;
  private String dni;

  @Column(length = 80)
  private String cargo;

  @Column(length = 20)
  private String sexo;  
}
