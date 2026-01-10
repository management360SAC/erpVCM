package com.vcm.crm.repository;

import com.vcm.crm.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRepository extends JpaRepository<Client, Integer> {

  // Para la validación de duplicados por organización + razón social
  boolean existsByOrgIdAndLegalNameIgnoreCase(Integer orgId, String legalName);
}
