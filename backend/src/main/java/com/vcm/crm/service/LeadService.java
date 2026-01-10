package com.vcm.crm.service;

import com.vcm.crm.dto.LeadDtos;
import com.vcm.crm.dto.LeadStats;
import com.vcm.crm.entity.Lead;
import com.vcm.crm.entity.LeadForm;
import com.vcm.crm.model.LeadInterest;
import com.vcm.crm.model.LeadPriority;
import com.vcm.crm.model.LeadStatus;
import com.vcm.crm.repository.LeadFormRepository;
import com.vcm.crm.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepo;
    private final LeadFormRepository formRepo;

    @Value("${app.leads.publicSecret:}")
    private String publicSecret;

    // =========================================================
    // Validación de secret para webhook público
    // =========================================================
    public void validateSecret(String secretHeader) {
        if (StringUtils.hasText(publicSecret)) {
            if (!StringUtils.hasText(secretHeader) || !publicSecret.equals(secretHeader)) {
                throw new IllegalStateException("Invalid webhook secret");
            }
        }
    }

    // =========================================================
    // Crear lead público (landing / webhook)
    // =========================================================
    public LeadDtos.LeadDto createPublic(String formSlug, LeadDtos.LeadPublicCreateRequest body) {
        LeadForm form = formRepo.findBySlugAndActiveTrue(formSlug)
                .orElseThrow(() -> new NoSuchElementException("Formulario no existe/activo: " + formSlug));

        if (!StringUtils.hasText(body.getSourceCode())) {
            body.setSourceCode("direct");
        }

        Lead lead = new Lead();
        lead.setForm(form);
        lead.setSourceCode(body.getSourceCode());
        lead.setUtmSource(body.getUtmSource());
        lead.setUtmMedium(body.getUtmMedium());
        lead.setUtmCampaign(body.getUtmCampaign());
        lead.setUtmTerm(body.getUtmTerm());
        lead.setUtmContent(body.getUtmContent());
        lead.setReferrer(body.getReferrer());
        lead.setGclid(body.getGclid());
        lead.setFbclid(body.getFbclid());
        lead.setFullName(body.getFullName());
        lead.setEmail(body.getEmail());
        lead.setPhone(body.getPhone());
        lead.setMessage(body.getMessage());

        // servicio (si viene desde el formulario)
        lead.setServiceId(body.getServiceId());

        lead.setRawPayload(body.getRawPayload());
        lead.setStatus(LeadStatus.NEW);

        lead = leadRepo.save(lead);
        return toDto(lead);
    }

    // =========================================================
    // Crear lead desde el CRM (modal "Nuevo lead")
    // =========================================================
    public LeadDtos.LeadDto createFromCrm(LeadDtos.LeadCreateRequest body) {
        Lead lead = new Lead();

        lead.setFullName(body.getFullName());
        lead.setEmail(body.getEmail());
        lead.setPhone(body.getPhone());
        lead.setMessage(body.getMessage());

        // servicio: id + nombre
        lead.setServiceId(body.getServiceId());
        lead.setServiceName(body.getServiceName());

        lead.setCompany(body.getCompany());

        if (StringUtils.hasText(body.getInterest())) {
            lead.setInterest(LeadInterest.valueOf(body.getInterest()));
        }

        lead.setBudgetRange(body.getBudgetRange());
        lead.setTimeframe(body.getTimeframe());

        if (StringUtils.hasText(body.getPriority())) {
            lead.setPriority(LeadPriority.valueOf(body.getPriority()));
        }

        lead.setOwnerName(body.getOwnerName());
        lead.setNextActionDate(body.getNextActionDate());

        if (StringUtils.hasText(body.getSourceCode())) {
            lead.setSourceCode(body.getSourceCode());
        } else {
            lead.setSourceCode("crm-manual");
        }

        lead.setStatus(LeadStatus.NEW);

        lead = leadRepo.save(lead);
        return toDto(lead);
    }

    // =========================================================
    // Actualizar lead desde CRM (modal "Editar lead")
    // =========================================================
    public LeadDtos.LeadDto updateFromCrm(Integer id, LeadDtos.LeadUpdateRequest body) {
        Lead lead = leadRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Lead no encontrado"));

        if (StringUtils.hasText(body.getFullName()))
            lead.setFullName(body.getFullName());

        if (body.getEmail() != null)
            lead.setEmail(body.getEmail());

        if (body.getPhone() != null)
            lead.setPhone(body.getPhone());

        if (body.getMessage() != null)
            lead.setMessage(body.getMessage());

        if (StringUtils.hasText(body.getSourceCode()))
            lead.setSourceCode(body.getSourceCode());

        if (body.getCompany() != null)
            lead.setCompany(body.getCompany());

        // servicio: id + nombre
        if (body.getServiceId() != null)
            lead.setServiceId(body.getServiceId());

        if (body.getServiceName() != null)
            lead.setServiceName(body.getServiceName());

        if (body.getInterest() != null) {
            lead.setInterest(LeadInterest.valueOf(body.getInterest()));
        }

        if (body.getBudgetRange() != null)
            lead.setBudgetRange(body.getBudgetRange());

        if (body.getTimeframe() != null)
            lead.setTimeframe(body.getTimeframe());

        if (body.getPriority() != null) {
            lead.setPriority(LeadPriority.valueOf(body.getPriority()));
        }

        if (body.getOwnerName() != null)
            lead.setOwnerName(body.getOwnerName());

        if (body.getNextActionDate() != null)
            lead.setNextActionDate(body.getNextActionDate());

        if (StringUtils.hasText(body.getStatus())) {
            lead.setStatus(LeadStatus.valueOf(body.getStatus()));
        }

        lead = leadRepo.save(lead);
        return toDto(lead);
    }

    // =========================================================
    // Actualizar solo estado
    // =========================================================
    public LeadDtos.LeadDto updateStatus(Integer id, String status) {
        Lead lead = leadRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Lead no encontrado"));

        lead.setStatus(LeadStatus.valueOf(status));
        lead = leadRepo.save(lead);
        return toDto(lead);
    }

    // =========================================================
    // Listado paginado con filtros
    // =========================================================
    public Page<LeadDtos.LeadDto> list(
            Integer formId,
            String sourceCode,
            String status,
            String q,
            int page,
            int size
    ) {
        Specification<Lead> spec = (root, cq, cb) -> {
            List<Predicate> ps = new ArrayList<>();

            if (formId != null) {
                ps.add(cb.equal(root.get("form").get("id"), formId));
            }
            if (StringUtils.hasText(sourceCode)) {
                ps.add(cb.equal(root.get("sourceCode"), sourceCode));
            }
            if (StringUtils.hasText(status)) {
                ps.add(cb.equal(root.get("status"), LeadStatus.valueOf(status)));
            }
            if (StringUtils.hasText(q)) {
                String like = "%" + q.toLowerCase() + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), like),
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(cb.lower(root.get("phone")), like),
                        cb.like(cb.lower(root.get("company")), like),
                        cb.like(cb.lower(root.get("serviceName")), like),
                        cb.like(cb.lower(root.get("message")), like)
                ));
            }

            return cb.and(ps.toArray(new Predicate[0]));
        };

        Page<Lead> pageRes = leadRepo.findAll(
                spec,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        List<LeadDtos.LeadDto> out = new ArrayList<>();
        for (Lead l : pageRes.getContent()) {
            out.add(toDto(l));
        }
        return new PageImpl<>(out, pageRes.getPageable(), pageRes.getTotalElements());
    }

    // =========================================================
    // Estadísticas simples
    // =========================================================
    public LeadStats getStats(LocalDate from, LocalDate to, String ownerUsername) {
        LocalDateTime start = (from != null)
                ? from.atStartOfDay()
                : LocalDate.now().minusDays(30).atStartOfDay();

        LocalDateTime end = (to != null)
                ? to.atTime(LocalTime.MAX)
                : LocalDate.now().atTime(LocalTime.MAX);

        Specification<Lead> spec = (root, cq, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.between(root.get("createdAt"), start, end));
            return cb.and(ps.toArray(new Predicate[0]));
        };

        long total = leadRepo.count(spec);

        long open = total;
        long won = 0L;
        long lost = 0L;

        return new LeadStats(total, open, won, lost);
    }

    // =========================================================
    // Mapper entidad → DTO
    // =========================================================
    private LeadDtos.LeadDto toDto(Lead l) {
        return LeadDtos.LeadDto.builder()
                .id(l.getId())
                .formSlug(l.getForm() != null ? l.getForm().getSlug() : null)
                .formName(l.getForm() != null ? l.getForm().getName() : null)
                .sourceCode(l.getSourceCode())
                .fullName(l.getFullName())
                .email(l.getEmail())
                .phone(l.getPhone())
                .message(l.getMessage())
                .status(l.getStatus() != null ? l.getStatus().name() : "NEW")
                .createdAt(l.getCreatedAt())

                .company(l.getCompany())
                .serviceId(l.getServiceId())
                .serviceName(l.getServiceName())
                .interest(l.getInterest() != null ? l.getInterest().name() : null)
                .budgetRange(l.getBudgetRange())
                .timeframe(l.getTimeframe())
                .priority(l.getPriority() != null ? l.getPriority().name() : null)
                .ownerName(l.getOwnerName())
                .nextActionDate(l.getNextActionDate())
                .build();
    }
}
