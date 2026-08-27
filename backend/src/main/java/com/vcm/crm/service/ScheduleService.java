package com.vcm.crm.service;

import com.vcm.crm.dto.ScheduleDtos.CreateScheduleRequest;
import com.vcm.crm.dto.ScheduleDtos.ScheduleResponse;
import com.vcm.crm.dto.ScheduleDtos.TaskItem;
import com.vcm.crm.dto.ScheduleDtos.UpdateScheduleRequest;
import com.vcm.crm.entity.Project;
import com.vcm.crm.entity.Schedule;
import com.vcm.crm.entity.ScheduleTask;
import com.vcm.crm.repository.ProjectRepository;
import com.vcm.crm.repository.ScheduleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepo;
    private final ProjectRepository projectRepo;
    private final SequenceService sequenceService;

    public ScheduleService(ScheduleRepository scheduleRepo, ProjectRepository projectRepo, SequenceService sequenceService) {
        this.scheduleRepo = scheduleRepo;
        this.projectRepo = projectRepo;
        this.sequenceService = sequenceService;
    }

    public Page<ScheduleResponse> list(String q, String status, int page, int size) {
        Page<Schedule> rows = scheduleRepo.search(1, q, status, PageRequest.of(page, size));
        return rows.map(this::toDto);
    }

    public ScheduleResponse get(Long id) {
        Schedule s = scheduleRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Cronograma no encontrado"));
        return toDto(s);
    }

    @Transactional
    public ScheduleResponse create(CreateScheduleRequest req) {
        if (req.projectId == null) {
            throw new IllegalArgumentException("El proyecto es requerido");
        }
        Project project = projectRepo.findById(req.projectId)
            .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado"));

        Schedule s = new Schedule();
        s.setOrgId(1);
        s.setCode(sequenceService.next("CRG", 4));
        s.setProject(project);
        s.setOwnerName(req.ownerName);
        s.setStartDate(req.startDate);
        s.setEndDate(req.endDate);
        s.setStatus((req.status != null && !req.status.trim().isEmpty()) ? req.status : "PENDIENTE");

        if (req.tasks != null) {
            int order = 0;
            for (TaskItem ti : req.tasks) {
                if (ti.name == null || ti.name.trim().isEmpty()) continue;
                ScheduleTask task = new ScheduleTask();
                task.setSchedule(s);
                task.setName(ti.name.trim());
                task.setDone(Boolean.TRUE.equals(ti.done));
                task.setDueDate(ti.dueDate);
                task.setSortOrder(order++);
                s.getTasks().add(task);
            }
        }

        return toDto(scheduleRepo.save(s));
    }

    @Transactional
    public ScheduleResponse update(Long id, UpdateScheduleRequest req) {
        Schedule s = scheduleRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Cronograma no encontrado"));

        if (req.ownerName != null) s.setOwnerName(req.ownerName);
        if (req.startDate != null) s.setStartDate(req.startDate);
        if (req.endDate != null) s.setEndDate(req.endDate);
        if (req.status != null && !req.status.trim().isEmpty()) s.setStatus(req.status);

        if (req.tasks != null) {
            Map<Long, ScheduleTask> existingById = s.getTasks().stream()
                .filter(t -> t.getId() != null)
                .collect(Collectors.toMap(ScheduleTask::getId, t -> t));

            List<ScheduleTask> updated = new ArrayList<>();
            int order = 0;
            for (TaskItem ti : req.tasks) {
                if (ti.name == null || ti.name.trim().isEmpty()) continue;
                ScheduleTask task = (ti.id != null) ? existingById.get(ti.id) : null;
                if (task == null) {
                    task = new ScheduleTask();
                    task.setSchedule(s);
                }
                task.setName(ti.name.trim());
                task.setDone(Boolean.TRUE.equals(ti.done));
                task.setDueDate(ti.dueDate);
                task.setSortOrder(order++);
                updated.add(task);
            }
            // orphanRemoval=true en Schedule.tasks se encarga de borrar las que ya no están
            s.getTasks().clear();
            s.getTasks().addAll(updated);
        }

        return toDto(scheduleRepo.save(s));
    }

    private ScheduleResponse toDto(Schedule s) {
        ScheduleResponse r = new ScheduleResponse();
        r.id = s.getId();
        r.code = s.getCode();
        r.projectId = s.getProject() != null ? s.getProject().getId() : null;
        r.projectName = s.getProject() != null ? s.getProject().getName() : null;
        r.ownerName = s.getOwnerName();
        r.startDate = s.getStartDate();
        r.endDate = s.getEndDate();
        r.status = s.getStatus();
        r.createdAt = s.getCreatedAt();

        List<TaskItem> tasks = s.getTasks().stream().map(t -> {
            TaskItem ti = new TaskItem();
            ti.id = t.getId();
            ti.name = t.getName();
            ti.done = t.getDone();
            ti.dueDate = t.getDueDate();
            return ti;
        }).collect(Collectors.toList());

        r.tasks = tasks;
        r.totalTasks = tasks.size();
        r.completedTasks = (int) tasks.stream().filter(t -> Boolean.TRUE.equals(t.done)).count();
        r.progress = r.totalTasks > 0 ? Math.round(100f * r.completedTasks / r.totalTasks) : 0;

        return r;
    }
}
