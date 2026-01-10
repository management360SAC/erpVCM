package com.vcm.crm.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vcm.crm.dto.EmailCampaignResponse;
import com.vcm.crm.entity.Client;
import com.vcm.crm.entity.EmailCampaign;
import com.vcm.crm.entity.EmailCampaignRecipient;
import com.vcm.crm.entity.EmailCampaignStatus;
import com.vcm.crm.repository.ClientRepository;
import com.vcm.crm.repository.EmailCampaignRecipientRepository;
import com.vcm.crm.repository.EmailCampaignRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmailCampaignService {

    private final EmailCampaignRepository campaignRepo;
    private final EmailCampaignRecipientRepository recipientRepo;
    private final ClientRepository clientRepo;
    private final MailService mailService;

    public EmailCampaignService(
            EmailCampaignRepository campaignRepo,
            EmailCampaignRecipientRepository recipientRepo,
            ClientRepository clientRepo,
            MailService mailService
    ) {
        this.campaignRepo = campaignRepo;
        this.recipientRepo = recipientRepo;
        this.clientRepo = clientRepo;
        this.mailService = mailService;
    }

    /* ==========================
           CREAR DESDE FORM
       ========================== */
    @Transactional
    public EmailCampaign createCampaignFromForm(
            Integer orgId,
            String name,
            String subject,
            String bodyHtml,
            String scheduledAt,
            String clientIdsJson,
            MultipartFile headerImage
    ) throws Exception {

        // 1) Parsear clientIds desde JSON
        ObjectMapper mapper = new ObjectMapper();
        Integer[] idsArray = mapper.readValue(clientIdsJson, Integer[].class);
        List<Integer> clientIds = Arrays.asList(idsArray);

        // 2) Filtrar clientes con email válido
        List<Client> clients = clientRepo.findAllById(clientIds).stream()
                .filter(c -> c.getEmail() != null && !c.getEmail().trim().isEmpty())
                .collect(Collectors.toList());

        if (clients.isEmpty()) {
            throw new IllegalArgumentException("No hay clientes con correo para esta campaña.");
        }

        // 3) Insertar imagen (si hay)
        String finalHtml = appendImageAtBottom(bodyHtml, headerImage);

        // 4) Crear campaña
        EmailCampaign campaign = new EmailCampaign();
        campaign.setOrgId(orgId);
        campaign.setName(name);
        campaign.setSubject(subject);
        campaign.setBodyHtml(finalHtml);
        campaign.setStatus(EmailCampaignStatus.BORRADOR);
        campaign.setTotalRecipients(clients.size());
        campaign.setCreatedAt(LocalDateTime.now());

        // Guardar imagen si viene
        if (headerImage != null && !headerImage.isEmpty()) {
            campaign.setHeaderImageBytes(headerImage.getBytes());
            campaign.setHeaderImageContentType(headerImage.getContentType());
        }

        campaign = campaignRepo.save(campaign);

        // 5) Recipients
        for (Client c : clients) {
            EmailCampaignRecipient r = new EmailCampaignRecipient();
            r.setCampaign(campaign);
            r.setClientId(c.getId());
            r.setEmail(c.getEmail());
            r.setStatus("PENDING");
            recipientRepo.save(r);

            campaign.getRecipients().add(r);
        }

        // 6) Enviar ahora
        sendNow(campaign);

        return campaign;
    }

    /* ==========================
       MÉTODO CORREGIDO
       ========================== */

    /**
     * Inserta la imagen al final del cuerpo HTML.
     */
    private String appendImageAtBottom(String bodyHtml, MultipartFile headerImage) {
        if (bodyHtml == null) bodyHtml = "";

        String placeholder = "<div style='margin-top:20px;text-align:center;'>{{HEADER_IMG}}</div>";

        // si no hay imagen → devolver igual
        if (headerImage == null || headerImage.isEmpty()) {
            return bodyHtml;
        }

        // agregar al final del HTML
        return bodyHtml + placeholder;
    }

    /** 
     * Método original que estaba mal ubicado
     */
    private String appendImageInsideContainer(String bodyHtml) {
        if (bodyHtml == null) bodyHtml = "";
        String placeholder = "<div style='margin-top:20px;text-align:center;'>{{HEADER_IMG}}</div>";
        String marker = "<!--VCM-FOOTER-->";

        if (bodyHtml.contains(marker)) {
            return bodyHtml.replace(marker, placeholder + marker);
        }
        return bodyHtml + placeholder;
    }

    /* ==========================
            ENVIAR AHORA
       ========================== */
    @Transactional
    public void sendNow(EmailCampaign campaign) {

        List<EmailCampaignRecipient> recipients = campaign.getRecipients();
        int enviados = 0;

        for (EmailCampaignRecipient r : recipients) {
            try {

                if (campaign.getHeaderImageBytes() != null) {
                    mailService.sendHtmlWithInlineImage(
                            r.getEmail(),
                            campaign.getSubject(),
                            campaign.getBodyHtml(),
                            campaign.getHeaderImageBytes(),
                            campaign.getHeaderImageContentType()
                    );
                } else {
                    mailService.sendHtml(
                            r.getEmail(),
                            campaign.getSubject(),
                            campaign.getBodyHtml()
                    );
                }

                r.setStatus("SENT");
                r.setSentAt(LocalDateTime.now());
                enviados++;

            } catch (Exception e) {
                r.setStatus("ERROR");
            }
        }

        campaign.setSentCount(enviados);
        campaign.setStatus(EmailCampaignStatus.ENVIADA);
        campaign.setSentAt(LocalDateTime.now());
        campaignRepo.save(campaign);
    }

    /* ==========================
           DTO
       ========================== */
    public EmailCampaignResponse toDto(EmailCampaign c) {
        EmailCampaignResponse r = new EmailCampaignResponse();
        r.id = c.getId();
        r.orgId = c.getOrgId();
        r.name = c.getName();
        r.status = c.getStatus();
        r.sent = c.getSentCount();
        r.opens = c.getOpensCount();
        r.clicks = c.getClicksCount();
        r.scheduledAt = c.getScheduledAt();
        return r;
    }
}
