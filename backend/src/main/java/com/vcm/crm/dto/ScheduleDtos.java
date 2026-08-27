package com.vcm.crm.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ScheduleDtos {

    public static class TaskItem {
        public Long id;          // null = tarea nueva
        public String name;
        public Boolean done;
        public LocalDate dueDate;
    }

    public static class ScheduleResponse {
        public Long id;
        public String code;
        public Long projectId;
        public String projectName;
        public String ownerName;
        public LocalDate startDate;
        public LocalDate endDate;
        public String status;
        public Integer progress;
        public Integer totalTasks;
        public Integer completedTasks;
        public List<TaskItem> tasks;
        public LocalDateTime createdAt;
    }

    public static class CreateScheduleRequest {
        public Long projectId;
        public String ownerName;
        public LocalDate startDate;
        public LocalDate endDate;
        public String status;
        public List<TaskItem> tasks;
    }

    public static class UpdateScheduleRequest {
        public String ownerName;
        public LocalDate startDate;
        public LocalDate endDate;
        public String status;
        public List<TaskItem> tasks; // reemplaza el checklist completo
    }
}
