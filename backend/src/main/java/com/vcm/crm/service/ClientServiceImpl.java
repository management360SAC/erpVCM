package com.vcm.crm.service;

import com.vcm.crm.dto.ClientDtos;
import com.vcm.crm.entity.Client;
import com.vcm.crm.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository repo;

    @Override
    public List<ClientDtos.ClientResponse> list() {
        return repo.findAll().stream()
                .map(this::toResp)
                .collect(Collectors.toList());
    }

    @Override
    public ClientDtos.ClientResponse get(Integer id) {
        Client c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado: " + id));
        return toResp(c);
    }

    @Override
    public ClientDtos.ClientResponse create(ClientDtos.CreateClientRequest req) {
        // Validación simple de duplicados por org + legalName
        if (repo.existsByOrgIdAndLegalNameIgnoreCase(req.getOrgId(), req.getLegalName())) {
            throw new IllegalArgumentException("Ya existe un cliente con esa razón social en la organización.");
        }

        Client c = new Client();
        c.setOrgId(req.getOrgId());
        c.setLegalName(req.getLegalName().trim());
        c.setTaxId(req.getTaxId());
        c.setEmail(req.getEmail());
        c.setPhone(req.getPhone());
        c = repo.save(c);
        return toResp(c);
    }

    @Override
    public ClientDtos.ClientResponse update(Integer id, ClientDtos.UpdateClientRequest req) {
        Client c = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado: " + id));

        if (req.getLegalName() != null) c.setLegalName(req.getLegalName().trim());
        if (req.getTaxId() != null) c.setTaxId(req.getTaxId());
        if (req.getEmail() != null) c.setEmail(req.getEmail());
        if (req.getPhone() != null) c.setPhone(req.getPhone());

        c = repo.save(c);
        return toResp(c);
    }

    @Override
    public void delete(Integer id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Cliente no encontrado: " + id);
        }
        repo.deleteById(id);
    }

    private ClientDtos.ClientResponse toResp(Client c) {
        ClientDtos.ClientResponse r = new ClientDtos.ClientResponse();
        r.setId(c.getId());
        r.setOrgId(c.getOrgId());
        r.setLegalName(c.getLegalName());
        r.setTaxId(c.getTaxId());
        r.setEmail(c.getEmail());
        r.setPhone(c.getPhone());
        return r;
    }
}