package com.vcm.crm.controller;

import com.vcm.crm.dto.EmailCampaignDto;
import com.vcm.crm.entity.EmailCampaign;
import com.vcm.crm.repository.EmailCampaignRepository;
import com.vcm.crm.service.EmailCampaignService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marketing/email")
public class EmailCampaignController {

    private final EmailCampaignRepository repo;
    private final EmailCampaignService service;

    public EmailCampaignController(EmailCampaignRepository repo, EmailCampaignService service) {
        this.repo    = repo;
        this.service = service;
    }

    // -------------------------------------------------------
    //  GET /api/marketing/email/campaigns
    // -------------------------------------------------------
    @GetMapping("/campaigns")
    public List<EmailCampaignDto> listCampaigns(@RequestParam(required = false) Integer orgId) {
        List<EmailCampaign> list = (orgId != null) ? repo.findByOrgId(orgId) : repo.findAll();
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    // -------------------------------------------------------
    //  POST /api/marketing/email/campaigns  (multipart)
    //
    //  Parámetros nuevos:
    //   manualEmails — JSON array de correos manuales (opcional)
    //                  Ej: '["foo@bar.com","baz@qux.com"]'
    // -------------------------------------------------------
    @PostMapping(value = "/campaigns", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @RequestParam("orgId")                              Integer   orgId,
            @RequestParam("name")                               String    name,
            @RequestParam("subject")                            String    subject,
            @RequestParam("bodyHtml")                           String    bodyHtml,
            @RequestParam(value = "scheduledAt",  required = false) String scheduledAt,
            @RequestParam(value = "clientIds",    required = false) String clientIdsJson,
            @RequestParam(value = "manualEmails", required = false) String manualEmailsJson,
            @RequestPart(value  = "headerImage",  required = false) MultipartFile headerImage
    ) {
        try {
            // Admitir clientIds vacío si hay emails manuales
            String safeClientIds = (clientIdsJson != null && !clientIdsJson.trim().isEmpty())
                    ? clientIdsJson : "[]";

            EmailCampaign campaign = service.createCampaignFromForm(
                    orgId, name, subject, bodyHtml, scheduledAt,
                    safeClientIds, manualEmailsJson, headerImage);

            return ResponseEntity.ok(toDto(campaign));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error interno: " + e.getMessage());
        }
    }

    // -------------------------------------------------------
    //  Mapper entidad → DTO
    // -------------------------------------------------------
    private EmailCampaignDto toDto(EmailCampaign c) {
        EmailCampaignDto d = new EmailCampaignDto();
        d.id              = c.getId();
        d.orgId           = c.getOrgId();
        d.name            = c.getName();
        d.subject         = c.getSubject();
        d.status          = c.getStatus().name();
        d.totalRecipients = c.getTotalRecipients();
        d.sentCount       = c.getSentCount();
        d.opensCount      = c.getOpensCount();
        d.clicksCount     = c.getClicksCount();
        d.scheduledAt     = c.getScheduledAt();
        d.sentAt          = c.getSentAt();
        d.createdAt       = c.getCreatedAt();
        d.headerImagePath = null;
        return d;
    }
}
