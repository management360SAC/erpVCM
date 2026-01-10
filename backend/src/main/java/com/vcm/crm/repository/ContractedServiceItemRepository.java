package com.vcm.crm.repository;

import com.vcm.crm.entity.ContractedServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContractedServiceItemRepository extends JpaRepository<ContractedServiceItem, Long> {
    List<ContractedServiceItem> findByContractedServiceId(Long contractedServiceId);
    void deleteByContractedServiceId(Long contractedServiceId);
}
