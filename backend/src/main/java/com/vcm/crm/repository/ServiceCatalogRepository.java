package com.vcm.crm.repository;

import com.vcm.crm.entity.ServiceCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalog, Integer> {
}
