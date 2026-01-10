package com.vcm.crm.service;

import com.vcm.crm.dto.ServiceDtos.CreateServiceRequest;
import com.vcm.crm.dto.ServiceDtos.ServiceResponse;
import com.vcm.crm.dto.ServiceDtos.UpdateServiceRequest;
import com.vcm.crm.entity.BillingModel;
import com.vcm.crm.entity.ServiceCatalog;
import com.vcm.crm.repository.ServiceCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceCatalogServiceImpl implements ServiceCatalogService {

    private final ServiceCatalogRepository repo;

    @Override
    @Transactional(readOnly = true)
    public List<ServiceResponse> list() {
        return repo.findAll()
                .stream()
                .map(this::toResp)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceResponse get(Integer id) {
        ServiceCatalog s = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Servicio no encontrado"));
        return toResp(s);
    }

    @Override
    @Transactional
    public ServiceResponse create(CreateServiceRequest req) {
        ServiceCatalog s = new ServiceCatalog();
        s.setOrgId(req.getOrgId());
        s.setName(req.getName());

        // 🔒 Siempre MENSUAL, ignoramos lo que venga en el request
        s.setBillingModel(BillingModel.MENSUAL);

        // Evitar null en basePrice
        BigDecimal price = req.getBasePrice() != null ? req.getBasePrice() : BigDecimal.ZERO;
        s.setBasePrice(price);

        s.setIsActive(true);

        s = repo.save(s);
        return toResp(s);
    }

    @Override
    @Transactional
    public ServiceResponse update(Integer id, UpdateServiceRequest req) {
        ServiceCatalog s = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Servicio no encontrado"));

        if (req.getName() != null) {
            s.setName(req.getName());
        }
        if (req.getBasePrice() != null) {
            s.setBasePrice(req.getBasePrice());
        }
        if (req.getIsActive() != null) {
            s.setIsActive(req.getIsActive());
        }

        // 🔒 En update también mantenemos siempre MENSUAL
        s.setBillingModel(BillingModel.MENSUAL);

        s = repo.save(s);
        return toResp(s);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        repo.deleteById(id);
    }

    private ServiceResponse toResp(ServiceCatalog s) {
        ServiceResponse r = new ServiceResponse();
        r.setId(s.getId());
        r.setOrgId(s.getOrgId());
        r.setName(s.getName());
        r.setBillingModel(s.getBillingModel());
        r.setBasePrice(s.getBasePrice());
        r.setIsActive(s.getIsActive());
        return r;
    }
}
