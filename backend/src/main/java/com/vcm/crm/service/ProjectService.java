package com.vcm.crm.service;

import com.vcm.crm.dto.ProjectDtos.CreateProjectRequest;
import com.vcm.crm.dto.ProjectDtos.ProjectResponse;
import com.vcm.crm.dto.ProjectDtos.UpdateProjectRequest;
import com.vcm.crm.entity.Client;
import com.vcm.crm.entity.Project;
import com.vcm.crm.repository.ClientRepository;
import com.vcm.crm.repository.ProjectRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
public class ProjectService {

    private final ProjectRepository projectRepo;
    private final ClientRepository clientRepo;
    private final SequenceService sequenceService;

    public ProjectService(ProjectRepository projectRepo, ClientRepository clientRepo, SequenceService sequenceService) {
        this.projectRepo = projectRepo;
        this.clientRepo = clientRepo;
        this.sequenceService = sequenceService;
    }

    public Page<ProjectResponse> list(String q, String status, int page, int size) {
        Page<Project> rows = projectRepo.search(1, q, status, PageRequest.of(page, size));
        return rows.map(this::toDto);
    }

    public ProjectResponse get(Long id) {
        Project p = projectRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Proyecto no encontrado"));
        return toDto(p);
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest req) {
        if (req.name == null || req.name.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del proyecto es requerido");
        }

        Project p = new Project();
        p.setOrgId(1);
        p.setCode(sequenceService.next("PRY", 4));
        p.setName(req.name.trim());
        p.setOwnerName(req.ownerName);
        p.setBudgetTotal(req.budgetTotal);
        p.setProgress(req.progress != null ? clamp(req.progress) : 0);
        p.setStatus((req.status != null && !req.status.trim().isEmpty()) ? req.status : "PENDIENTE");
        p.setStartDate(req.startDate);
        p.setEndDate(req.endDate);

        if (req.clientId != null) {
            Client client = clientRepo.findById(req.clientId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
            p.setClient(client);
        }

        return toDto(projectRepo.save(p));
    }

    @Transactional
    public ProjectResponse update(Long id, UpdateProjectRequest req) {
        Project p = projectRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Proyecto no encontrado"));

        if (req.name != null && !req.name.trim().isEmpty()) p.setName(req.name.trim());
        if (req.ownerName != null) p.setOwnerName(req.ownerName);
        if (req.budgetTotal != null) p.setBudgetTotal(req.budgetTotal);
        if (req.progress != null) p.setProgress(clamp(req.progress));
        if (req.status != null && !req.status.trim().isEmpty()) p.setStatus(req.status);
        if (req.startDate != null) p.setStartDate(req.startDate);
        if (req.endDate != null) p.setEndDate(req.endDate);

        if (req.clientId != null) {
            Client client = clientRepo.findById(req.clientId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
            p.setClient(client);
        }

        return toDto(projectRepo.save(p));
    }

    private int clamp(int v) {
        return Math.max(0, Math.min(100, v));
    }

    private ProjectResponse toDto(Project p) {
        ProjectResponse r = new ProjectResponse();
        r.id = p.getId();
        r.code = p.getCode();
        r.name = p.getName();
        r.ownerName = p.getOwnerName();
        r.budgetTotal = p.getBudgetTotal();
        r.progress = p.getProgress();
        r.status = p.getStatus();
        r.startDate = p.getStartDate();
        r.endDate = p.getEndDate();
        r.createdAt = p.getCreatedAt();
        if (p.getClient() != null) {
            r.clientId = p.getClient().getId();
            r.clientName = p.getClient().getLegalName();
        }
        return r;
    }
}
