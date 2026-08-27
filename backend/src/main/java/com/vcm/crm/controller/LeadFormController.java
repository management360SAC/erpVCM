package com.vcm.crm.controller;

import com.vcm.crm.dto.LeadFormDtos.CreateLeadFormRequest;
import com.vcm.crm.dto.LeadFormDtos.LeadFormResponse;
import com.vcm.crm.entity.LeadForm;
import com.vcm.crm.repository.LeadFormRepository;
import com.vcm.crm.repository.LeadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Landings / formularios de captura de leads. Reutiliza la entidad LeadForm
 * (ya usada por el webhook público de leads en LeadController) en vez de crear
 * un módulo de "landing pages" paralelo. No existe tracking de visitas/vistas
 * en el sistema, así que no se expone una tasa de conversión inventada: solo
 * el conteo real de leads capturados por cada formulario.
 */
@RestController
@RequestMapping("/api/marketing/landings")
public class LeadFormController {

    private final LeadFormRepository leadFormRepo;
    private final LeadRepository leadRepo;

    public LeadFormController(LeadFormRepository leadFormRepo, LeadRepository leadRepo) {
        this.leadFormRepo = leadFormRepo;
        this.leadRepo = leadRepo;
    }

    @GetMapping
    public List<LeadFormResponse> list() {
        return leadFormRepo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateLeadFormRequest req) {
        if (req.name == null || req.name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(error("El nombre es requerido"));
        }

        String slug = (req.slug != null && !req.slug.trim().isEmpty())
            ? slugify(req.slug)
            : slugify(req.name);

        if (leadFormRepo.existsBySlug(slug)) {
            return ResponseEntity.badRequest().body(error("Ya existe una landing con el path '" + slug + "'"));
        }

        LeadForm form = new LeadForm();
        form.setName(req.name.trim());
        form.setSlug(slug);
        form.setActive(req.active != null ? req.active : Boolean.TRUE);

        LeadForm saved = leadFormRepo.save(form);
        return ResponseEntity.ok(toDto(saved));
    }

    private LeadFormResponse toDto(LeadForm f) {
        LeadFormResponse r = new LeadFormResponse();
        r.id = f.getId();
        r.name = f.getName();
        r.slug = f.getSlug();
        r.active = f.getActive();
        r.createdAt = f.getCreatedAt();
        r.leadsCount = leadRepo.countByForm_Id(f.getId());
        return r;
    }

    private String slugify(String s) {
        String slug = s.trim().toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-");
        return slug.isEmpty() ? "landing" : slug;
    }

    private Map<String, String> error(String msg) {
        Map<String, String> m = new HashMap<>();
        m.put("error", msg);
        return m;
    }
}
