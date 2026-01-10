package com.vcm.crm.controller;

import com.vcm.crm.dto.EmailCampaignDto;
import com.vcm.crm.entity.EmailCampaign;
import com.vcm.crm.repository.EmailCampaignRepository;
import com.vcm.crm.service.EmailCampaignService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marketing/email")
public class EmailCampaignController {

    private final EmailCampaignRepository repo;
    private final EmailCampaignService service;

    public EmailCampaignController(
            EmailCampaignRepository repo,
            EmailCampaignService service
    ) {
        this.repo = repo;
        this.service = service;
    }

    /* ===== LISTAR ===== */
    @GetMapping("/campaigns")
    public List<EmailCampaignDto> listCampaigns(@RequestParam(required = false) Integer orgId) {
        List<EmailCampaign> list;

        if (orgId != null) {
            list = repo.findByOrgId(orgId);
        } else {
            list = repo.findAll();
        }

        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    private EmailCampaignDto toDto(EmailCampaign c) {
        EmailCampaignDto d = new EmailCampaignDto();
        d.id = c.getId();
        d.orgId = c.getOrgId();
        d.name = c.getName();
        d.subject = c.getSubject();
        d.status = c.getStatus().name();
        d.totalRecipients = c.getTotalRecipients();
        d.sentCount = c.getSentCount();
        d.opensCount = c.getOpensCount();
        d.clicksCount = c.getClicksCount();
        d.scheduledAt = c.getScheduledAt();
        d.sentAt = c.getSentAt();
        d.createdAt = c.getCreatedAt();
        d.headerImagePath = null; // si luego agregas ruta, aquí la asignas
        
        return d;
    }

    /* ===== CREAR + ENVIAR (multipart) ===== */
    @PostMapping(
        value = "/campaigns",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public EmailCampaignDto create(
            @RequestParam("orgId") Integer orgId,
            @RequestParam("name") String name,
            @RequestParam("subject") String subject,
            @RequestParam("bodyHtml") String bodyHtml,
            @RequestParam(value = "scheduledAt", required = false) String scheduledAt,
            @RequestParam("clientIds") String clientIdsJson,
            @RequestPart(value = "headerImage", required = false) MultipartFile headerImage
    ) throws Exception {

        EmailCampaign campaign = service.createCampaignFromForm(
                orgId,
                name,
                subject,
                bodyHtml,
                scheduledAt,
                clientIdsJson,
                headerImage
        );

        return toDto(campaign);
    }
}
