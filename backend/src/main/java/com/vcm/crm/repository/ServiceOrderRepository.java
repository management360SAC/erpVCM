package com.vcm.crm.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vcm.crm.entity.ServiceOrder;

public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {

  @Query("select count(o) from ServiceOrder o where o.contractedServiceId = :csId and o.status = 'ABIERTA'")
  long countOpenByContractedServiceId(@Param("csId") Long csId);
}
