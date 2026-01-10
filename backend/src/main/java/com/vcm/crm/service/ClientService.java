package com.vcm.crm.service;

import com.vcm.crm.dto.ClientDtos;

import java.util.List;

public interface ClientService {
  List<ClientDtos.ClientResponse> list();

  ClientDtos.ClientResponse get(Integer id);

  ClientDtos.ClientResponse create(ClientDtos.CreateClientRequest req);

  ClientDtos.ClientResponse update(Integer id, ClientDtos.UpdateClientRequest req);

  void delete(Integer id);
}
