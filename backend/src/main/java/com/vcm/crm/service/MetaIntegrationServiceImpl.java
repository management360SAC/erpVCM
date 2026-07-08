package com.vcm.crm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vcm.crm.dto.MetaIntegrationDtos.MetaConnectRequest;
import com.vcm.crm.dto.MetaIntegrationDtos.MetaStatusResponse;
import com.vcm.crm.entity.Lead;
import com.vcm.crm.entity.MetaIntegration;
import com.vcm.crm.model.LeadStatus;
import com.vcm.crm.repository.LeadRepository;
import com.vcm.crm.repository.MetaIntegrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetaIntegrationServiceImpl implements MetaIntegrationService {

    private static final String GRAPH_API_BASE = "https://graph.facebook.com/v19.0";
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_DATE_TIME;

    private final MetaIntegrationRepository repo;
    private final LeadRepository leadRepo;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Override
    @Transactional(readOnly = true)
    public MetaStatusResponse getStatus(Integer orgId) {
        MetaIntegration integration = getOrCreate(orgId);
        return toResponse(integration);
    }

    @Override
    @Transactional
    public MetaStatusResponse connect(Integer orgId, MetaConnectRequest req) {
        MetaIntegration integration = getOrCreate(orgId);
        integration.setPageId(req.getPageId());
        integration.setPageName(req.getPageName());
        integration.setPageAccessToken(req.getPageAccessToken());
        integration.setVerifyToken(req.getVerifyToken());
        integration.setStatus(MetaIntegration.MetaStatus.CONNECTED);
        integration.setUpdatedAt(LocalDateTime.now());
        repo.save(integration);
        return toResponse(integration);
    }

    @Override
    @Transactional
    public void disconnect(Integer orgId) {
        MetaIntegration integration = getOrCreate(orgId);
        integration.setStatus(MetaIntegration.MetaStatus.DISCONNECTED);
        integration.setPageAccessToken(null);
        integration.setUpdatedAt(LocalDateTime.now());
        repo.save(integration);
    }

    @Override
    public boolean verifyWebhook(String mode, String challenge, String verifyToken) {
        if (!"subscribe".equals(mode)) return false;
        return repo.findByVerifyToken(verifyToken).isPresent();
    }

    @Override
    @Transactional
    public void processWebhookEvent(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            if (!"page".equals(root.path("object").asText())) return;

            JsonNode entries = root.path("entry");
            for (JsonNode entry : entries) {
                String pageId = entry.path("id").asText();
                JsonNode changes = entry.path("changes");
                for (JsonNode change : changes) {
                    if ("leadgen".equals(change.path("field").asText())) {
                        String leadgenId = change.path("value").path("leadgen_id").asText();
                        processLeadgenEvent(pageId, leadgenId);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error processing Meta webhook event", e);
        }
    }

    private void processLeadgenEvent(String pageId, String leadgenId) {
        MetaIntegration integration = repo.findByPageId(pageId).orElse(null);
        if (integration == null || integration.getPageAccessToken() == null) {
            log.warn("No Meta integration found for page {}", pageId);
            return;
        }

        try {
            String url = GRAPH_API_BASE + "/" + leadgenId
                    + "?fields=id,field_data,created_time&access_token="
                    + integration.getPageAccessToken();

            String response = restTemplate.getForObject(url, String.class);
            JsonNode leadData = objectMapper.readTree(response);

            Lead lead = new Lead();
            lead.setSourceCode("META_LEAD_ADS");
            lead.setUtmSource("facebook");
            lead.setUtmMedium("lead_ads");
            lead.setStatus(LeadStatus.NEW);
            lead.setCreatedAt(LocalDateTime.now());

            JsonNode fieldData = leadData.path("field_data");
            for (JsonNode field : fieldData) {
                String name = field.path("name").asText().toLowerCase();
                String value = field.path("values").get(0).asText();
                switch (name) {
                    case "full_name":
                    case "nombre_completo":
                        lead.setFullName(value);
                        break;
                    case "first_name":
                        lead.setFullName(value + (lead.getFullName() != null ? " " + lead.getFullName() : ""));
                        break;
                    case "last_name":
                        lead.setFullName((lead.getFullName() != null ? lead.getFullName() + " " : "") + value);
                        break;
                    case "email":
                        lead.setEmail(value);
                        break;
                    case "phone_number":
                    case "telefono":
                        lead.setPhone(value);
                        break;
                    case "company_name":
                    case "empresa":
                        lead.setCompany(value);
                        break;
                    default:
                        break;
                }
            }

            if (lead.getFullName() == null || lead.getFullName().trim().isEmpty()) {
                lead.setFullName("Lead Meta #" + leadgenId);
            }

            leadRepo.save(lead);

            integration.setLastSyncAt(LocalDateTime.now());
            repo.save(integration);

            log.info("Meta lead {} created in CRM", leadgenId);
        } catch (Exception e) {
            log.error("Error fetching Meta lead {}", leadgenId, e);
        }
    }

    private MetaIntegration getOrCreate(Integer orgId) {
        return repo.findTopByOrgIdOrderByIdAsc(orgId)
                .orElseGet(() -> {
                    MetaIntegration m = new MetaIntegration();
                    m.setOrgId(orgId);
                    return repo.save(m);
                });
    }

    private MetaStatusResponse toResponse(MetaIntegration m) {
        MetaStatusResponse r = new MetaStatusResponse();
        r.setId(m.getId());
        r.setStatus(m.getStatus().name());
        r.setPageId(m.getPageId());
        r.setPageName(m.getPageName());
        r.setVerifyToken(m.getVerifyToken());
        r.setLastSyncAt(m.getLastSyncAt() != null ? m.getLastSyncAt().format(FMT) : null);
        r.setWebhookUrl("/api/webhooks/meta");
        return r;
    }
}
