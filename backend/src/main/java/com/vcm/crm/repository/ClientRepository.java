package com.vcm.crm.repository;

import com.vcm.crm.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRepository extends JpaRepository<Client, Integer> {

  boolean existsByOrgIdAndLegalNameIgnoreCase(Integer orgId, String legalName);

  java.util.Optional<Client> findByOrgIdAndLegalNameIgnoreCase(Integer orgId, String legalName);
}
