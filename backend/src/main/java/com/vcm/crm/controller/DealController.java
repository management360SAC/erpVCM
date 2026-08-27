package com.vcm.crm.controller;

import com.vcm.crm.dto.CreateDealRequest;
import com.vcm.crm.dto.DealResponse;
import com.vcm.crm.entity.Client;
import com.vcm.crm.entity.Deal;
import com.vcm.crm.entity.ServiceCatalog;
import com.vcm.crm.entity.Usuario;
import com.vcm.crm.repository.ClientRepository;
import com.vcm.crm.repository.DealRepository;
import com.vcm.crm.repository.ServiceCatalogRepository;
import com.vcm.crm.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/deals")
public class DealController {

    private final DealRepository dealRepo;
    private final UsuarioRepository usuarioRepo;
    private final ClientRepository clientRepo;
    private final ServiceCatalogRepository serviceCatalogRepo;

    public DealController(
            DealRepository dealRepo,
            UsuarioRepository usuarioRepo,
            ClientRepository clientRepo,
            ServiceCatalogRepository serviceCatalogRepo) {
        this.dealRepo = dealRepo;
        this.usuarioRepo = usuarioRepo;
        this.clientRepo = clientRepo;
        this.serviceCatalogRepo = serviceCatalogRepo;
    }

    /** POST /api/deals — crea una nueva oportunidad en el embudo.
     *  Si no se envía clientId pero sí newClient, registra el cliente al vuelo
     *  (reutilizando uno existente con el mismo nombre si ya existe). */
    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody CreateDealRequest req) {
        if (req.title == null || req.title.trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "El título de la oportunidad es requerido");
            return ResponseEntity.badRequest().body(err);
        }

        Deal deal = new Deal();
        deal.setOrgId(1);
        deal.setTitle(req.title.trim());
        deal.setAmount(req.amount);
        deal.setCurrency((req.currency != null && !req.currency.trim().isEmpty()) ? req.currency : "PEN");
        deal.setStage((req.stage != null && !req.stage.trim().isEmpty()) ? req.stage : "PROSPECTO");
        deal.setStatus("OPEN");

        if (req.clientId != null) {
            Client client = clientRepo.findById(req.clientId).orElse(null);
            if (client == null) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Cliente no encontrado");
                return ResponseEntity.badRequest().body(err);
            }
            deal.setClient(client);
        } else if (req.newClient != null && req.newClient.legalName != null && !req.newClient.legalName.trim().isEmpty()) {
            String legalName = req.newClient.legalName.trim();
            Client client = clientRepo.findByOrgIdAndLegalNameIgnoreCase(1, legalName).orElseGet(() -> {
                Client c = new Client();
                c.setOrgId(1);
                c.setLegalName(legalName);
                c.setTaxId(blankToNull(req.newClient.taxId));
                c.setEmail(blankToNull(req.newClient.email));
                c.setPhone(blankToNull(req.newClient.phone));
                return clientRepo.save(c);
            });
            deal.setClient(client);
        }

        if (req.serviceId != null) {
            ServiceCatalog service = serviceCatalogRepo.findById(req.serviceId).orElse(null);
            if (service == null) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Servicio no encontrado");
                return ResponseEntity.badRequest().body(err);
            }
            deal.setService(service);
        }

        Deal saved = dealRepo.save(deal);

        DealResponse r = new DealResponse();
        r.id = saved.getId();
        r.title = saved.getTitle();
        r.amount = saved.getAmount();
        r.currency = saved.getCurrency();
        r.stage = saved.getStage();
        r.status = saved.getStatus();
        r.createdAt = saved.getCreatedAt();
        if (saved.getClient() != null) {
            r.clientId = saved.getClient().getId();
            r.clientName = saved.getClient().getLegalName();
            r.clientSector = saved.getClient().getSector();
        }
        if (saved.getService() != null) {
            r.serviceId = saved.getService().getId();
            r.serviceName = saved.getService().getName();
        }

        return ResponseEntity.ok(r);
    }

    private String blankToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }

    /** GET /api/deals/board — retorna { deals: [...] } */
    @GetMapping("/board")
    public ResponseEntity<Map<String, List<DealResponse>>> getBoard() {
        int orgId = 1;
        List<Deal> deals = dealRepo.findByOrgId(orgId);

        List<DealResponse> result = deals.stream().map(d -> {
            DealResponse r = new DealResponse();
            r.id = d.getId();
            r.title = d.getTitle();
            r.amount = d.getAmount();
            r.currency = d.getCurrency();
            r.stage = d.getStage();
            r.status = d.getStatus();
            r.createdAt = d.getCreatedAt();
            r.serviceType = d.getServiceType();
            r.approvalDate = d.getApprovalDate();
            r.contractReference = d.getContractReference();
            r.externalQuoteNumber = d.getExternalQuoteNumber();
            r.invoiceReference = d.getInvoiceReference();
            r.collectedAmount = d.getCollectedAmount();
            r.balanceAmount = d.getBalanceAmount();

            // clientName: primero Client, si no MarketingLead
            if (d.getClient() != null) {
                r.clientId = d.getClient().getId();
                r.clientName = d.getClient().getLegalName();
                r.clientSector = d.getClient().getSector();
            } else if (d.getLead() != null) {
                r.clientName = d.getLead().getCompanyName() != null
                    ? d.getLead().getCompanyName()
                    : d.getLead().getName();
            }

            if (d.getService() != null) {
                r.serviceId = d.getService().getId();
                r.serviceName = d.getService().getName();
            }

            // ownerName: buscar usuario por ownerUserId
            if (d.getOwnerUserId() != null) {
                Optional<Usuario> owner = usuarioRepo.findById(d.getOwnerUserId().intValue());
                r.ownerName = owner.map(u -> u.getNombre() != null ? u.getNombre() : u.getUsername()).orElse(null);
            }

            return r;
        }).collect(Collectors.toList());

        Map<String, List<DealResponse>> resp = new HashMap<>();
        resp.put("deals", result);
        return ResponseEntity.ok(resp);
    }

    /** PUT /api/deals/{id}/stage — actualiza la etapa de un deal */
    @PutMapping("/{id}/stage")
    public ResponseEntity<?> updateStage(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String stage = body.get("stage");
        if (stage == null || stage.trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "El campo 'stage' es requerido");
            return ResponseEntity.badRequest().body(err);
        }

        Deal deal = dealRepo.findById(id).orElse(null);
        if (deal == null) {
            return ResponseEntity.notFound().build();
        }

        deal.setStage(stage);

        if ("CERRADO_GANADO".equals(stage)) {
            deal.setStatus("WON");
        } else if ("CERRADO_PERDIDO".equals(stage)) {
            deal.setStatus("LOST");
        } else {
            deal.setStatus("OPEN");
        }

        dealRepo.save(deal);

        DealResponse r = new DealResponse();
        r.id = deal.getId();
        r.title = deal.getTitle();
        r.amount = deal.getAmount();
        r.stage = deal.getStage();
        r.status = deal.getStatus();
        r.createdAt = deal.getCreatedAt();

        return ResponseEntity.ok(r);
    }
}
