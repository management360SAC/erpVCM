package com.vcm.crm.service;

import com.vcm.crm.dto.ServiceDtos.CreateServiceRequest;
import com.vcm.crm.dto.ServiceDtos.UpdateServiceRequest;
import com.vcm.crm.dto.ServiceDtos.ServiceResponse;

import java.util.List;

public interface ServiceCatalogService {
  List<ServiceResponse> list();
  ServiceResponse get(Integer id);
  ServiceResponse create(CreateServiceRequest req);
  ServiceResponse update(Integer id, UpdateServiceRequest req);
  void delete(Integer id);
}
