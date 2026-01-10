package com.vcm.crm.dto;

import com.vcm.crm.entity.BillingModel;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ClientServiceDTO {

  // IDs (usa Integer para alinear con tus entidades/repos)
  private Integer clientServiceId;   // id del client_service
  private Integer clientId;
  private Integer serviceId;

  // Aliases para compatibilidad con código existente:
  // Muchos servicios llaman setId()/getId() en el DTO.
  public Integer getId() { return clientServiceId; }
  public void setId(Integer id) { this.clientServiceId = id; }

  // Datos de cliente/servicio (nombres)
  private String clientName;         // lo pide ServiceTrackingService
  private String serviceName;

  // Estado y fechas
  private Boolean active;
  private LocalDate startDate;
  private LocalDate endDate;
  private String notes;

  // Precios
  private BigDecimal price;          // usaremos este como "precio"
  // Alias para compatibilidad: setMonthlyPrice()/getMonthlyPrice()
  public BigDecimal getMonthlyPrice() { return price; }
  public void setMonthlyPrice(BigDecimal p) { this.price = p; }

  // Datos del catálogo (para respuestas)
  private BillingModel billingModel; // ENUM
  private BigDecimal basePrice;      // precio base del catálogo
}
