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
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class EmailCampaignService {

    private static final Pattern EMAIL_REGEX =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

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
        this.campaignRepo  = campaignRepo;
        this.recipientRepo = recipientRepo;
        this.clientRepo    = clientRepo;
        this.mailService   = mailService;
    }

    // =========================================================
    //  CREAR CAMPAÑA DESDE FORMULARIO
    //  Acepta:
    //   - clientIdsJson  : "[1,2,3]" — clientes registrados
    //   - manualEmailsJson: '["a@b.com","c@d.com"]' — correos manuales (puede ser null)
    // =========================================================
    @Transactional
    public EmailCampaign createCampaignFromForm(
            Integer orgId,
            String name,
            String subject,
            String bodyHtml,
            String scheduledAt,
            String clientIdsJson,
            String manualEmailsJson,
            MultipartFile headerImage
    ) throws Exception {

        ObjectMapper mapper = new ObjectMapper();

        // ---- 1. Clientes registrados ----
        List<Client> clients = new ArrayList<>();
        if (clientIdsJson != null && !clientIdsJson.trim().isEmpty()) {
            Integer[] idsArray = mapper.readValue(clientIdsJson, Integer[].class);
            clients = clientRepo.findAllById(Arrays.asList(idsArray)).stream()
                    .filter(c -> c.getEmail() != null && !c.getEmail().trim().isEmpty())
                    .collect(Collectors.toList());
        }

        // ---- 2. Emails manuales (validar y deduplicar) ----
        Set<String> clientEmails = clients.stream()
                .map(c -> c.getEmail().trim().toLowerCase())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<String> manualOnlyEmails = new ArrayList<>(); // solo los que no están en clientes
        List<String> invalidEmails    = new ArrayList<>();

        if (manualEmailsJson != null && !manualEmailsJson.trim().isEmpty()) {
            String[] rawEmails = mapper.readValue(manualEmailsJson, String[].class);
            for (String raw : rawEmails) {
                String email = raw.trim().toLowerCase();
                if (email.isEmpty()) continue;
                if (!EMAIL_REGEX.matcher(email).matches()) {
                    invalidEmails.add(raw);
                    continue;
                }
                if (!clientEmails.contains(email)) {
                    manualOnlyEmails.add(email);
                    clientEmails.add(email); // evitar duplicados entre manuales
                }
                // si ya está en clientes, se ignora (no duplicar)
            }
        }

        if (!invalidEmails.isEmpty()) {
            throw new IllegalArgumentException(
                    "Los siguientes correos tienen formato inválido: " + String.join(", ", invalidEmails));
        }

        if (clients.isEmpty() && manualOnlyEmails.isEmpty()) {
            throw new IllegalArgumentException(
                    "No hay destinatarios válidos para esta campaña. Selecciona clientes o ingresa correos manualmente.");
        }

        // ---- 3. Imagen ----
        String finalHtml = appendImageAtBottom(bodyHtml, headerImage);

        // ---- 4. Crear campaña ----
        int totalRecipients = clients.size() + manualOnlyEmails.size();

        EmailCampaign campaign = new EmailCampaign();
        campaign.setOrgId(orgId);
        campaign.setName(name);
        campaign.setSubject(subject);
        campaign.setBodyHtml(finalHtml);
        campaign.setStatus(EmailCampaignStatus.BORRADOR);
        campaign.setTotalRecipients(totalRecipients);
        campaign.setCreatedAt(LocalDateTime.now());

        if (headerImage != null && !headerImage.isEmpty()) {
            campaign.setHeaderImageBytes(headerImage.getBytes());
            campaign.setHeaderImageContentType(headerImage.getContentType());
        }

        campaign = campaignRepo.save(campaign);

        // ---- 5. Recipients de clientes ----
        for (Client c : clients) {
            EmailCampaignRecipient r = new EmailCampaignRecipient();
            r.setCampaign(campaign);
            r.setClientId(c.getId());
            r.setEmail(c.getEmail().trim());
            r.setStatus("PENDING");
            recipientRepo.save(r);
            campaign.getRecipients().add(r);
        }

        // ---- 6. Recipients manuales (clientId = null) ----
        for (String email : manualOnlyEmails) {
            EmailCampaignRecipient r = new EmailCampaignRecipient();
            r.setCampaign(campaign);
            r.setClientId(null);  // email manual, no vinculado a cliente
            r.setEmail(email);
            r.setStatus("PENDING");
            recipientRepo.save(r);
            campaign.getRecipients().add(r);
        }

        // ---- 7. Enviar en segundo plano ----
        final EmailCampaign savedCampaign = campaign;
        sendNowAsync(savedCampaign);

        return campaign;
    }

    private String appendImageAtBottom(String bodyHtml, MultipartFile headerImage) {
        if (bodyHtml == null) bodyHtml = "";
        if (headerImage == null || headerImage.isEmpty()) return bodyHtml;
        String placeholder = "<div style='margin-top:20px;text-align:center;'>{{HEADER_IMG}}</div>";
        return bodyHtml + placeholder;
    }

    // =========================================================
    //  ENVIAR AHORA (async - no bloquea el request)
    // =========================================================
    @Async
    @Transactional
    public void sendNowAsync(EmailCampaign campaign) {
        sendNow(campaign);
    }

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

    // =========================================================
    //  DTO
    // =========================================================
    public EmailCampaignResponse toDto(EmailCampaign c) {
        EmailCampaignResponse r = new EmailCampaignResponse();
        r.id          = c.getId();
        r.orgId       = c.getOrgId();
        r.name        = c.getName();
        r.status      = c.getStatus();
        r.sent        = c.getSentCount();
        r.opens       = c.getOpensCount();
        r.clicks      = c.getClicksCount();
        r.scheduledAt = c.getScheduledAt();
        return r;
    }
}
