package com.vcm.crm.service;

import com.vcm.crm.dto.MarketingDtos;
import com.vcm.crm.entity.CrmNotification;
import com.vcm.crm.entity.Deal;
import com.vcm.crm.entity.MarketingLead;
import com.vcm.crm.repository.CrmNotificationRepository;
import com.vcm.crm.repository.DealRepository;
import com.vcm.crm.repository.MarketingLeadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class MarketingService {
    
    private final MarketingLeadRepository leadRepo;
    private final DealRepository dealRepo;
    private final CrmNotificationRepository notifRepo;

    public MarketingService(
        MarketingLeadRepository leadRepo,
        DealRepository dealRepo,
        CrmNotificationRepository notifRepo
    ) {
        this.leadRepo = leadRepo;
        this.dealRepo = dealRepo;
        this.notifRepo = notifRepo;
    }

    @Transactional
    public MarketingDtos.IntakeLeadResponse intakeLead(MarketingDtos.IntakeLeadRequest req) {
        MarketingLead lead = new MarketingLead();
        lead.setOrgId(req.orgId);
        lead.setSourceChannel(req.sourceChannel);
        lead.setSourceDetail(req.sourceDetail);
        lead.setName(req.name);
        lead.setEmail(req.email);
        lead.setPhone(req.phone);
        lead.setCompanyName(req.companyName);
        lead = leadRepo.save(lead);

        Deal deal = new Deal();
        deal.setOrgId(req.orgId);
        deal.setLead(lead);
        
        // Corregido: usar isEmpty() en lugar de isBlank() para Java 8
        deal.setTitle(req.companyName != null && !req.companyName.trim().isEmpty()
            ? "Oportunidad - " + req.companyName
            : "Oportunidad - " + (req.email != null ? req.email : "Sin nombre"));
        
        deal.setStage("PROSPECTO");
        deal.setStatus("OPEN");
        deal.setAmount(req.estimatedAmount);
        deal.setOwnerUserId(req.ownerUserId);
        deal = dealRepo.save(deal);

        CrmNotification notif = new CrmNotification();
        notif.setOrgId(req.orgId);
        notif.setType("QUOTE_REQUEST");
        notif.setTitle("Contactar lead y evaluar envío de cotización");
        notif.setDescription("Lead desde " + req.sourceChannel +
                (req.sourceDetail != null ? " (" + req.sourceDetail + ")" : ""));
        notif.setDeal(deal);
        notif.setLead(lead);
        notif.setDueDate(LocalDateTime.now().plusDays(1));
        notifRepo.save(notif);

        MarketingDtos.IntakeLeadResponse res = new MarketingDtos.IntakeLeadResponse();
        res.leadId = lead.getId();
        res.dealId = deal.getId();
        return res;
    }
}