package com.vcm.crm.repository;

import com.vcm.crm.entity.ClientService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClientServiceRepository extends JpaRepository<ClientService, Integer> {

  // Usando relaciones: client.id y service.id
  List<ClientService> findByClient_Id(Integer clientId);

  List<ClientService> findByClient_IdAndActiveTrue(Integer clientId);

  Optional<ClientService> findByClient_IdAndService_Id(Integer clientId, Integer serviceId);

  // Útiles si los usas en tu servicio
  boolean existsByClient_IdAndService_Id(Integer clientId, Integer serviceId);

  void deleteByClient_IdAndService_Id(Integer clientId, Integer serviceId);

  // Tracking por fechas (mantén estos tal cual)
  List<ClientService> findByEndDateBetweenAndActiveTrue(LocalDate startDate, LocalDate endDate);

  List<ClientService> findByEndDateBeforeAndActiveTrue(LocalDate date);

  List<ClientService> findByEndDateAfterAndActiveTrue(LocalDate date);
  List<ClientService> findByActiveTrue();
  List<ClientService> findByEndDateAndActiveTrue(LocalDate endDate);
}
