package com.vcm.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProjectDtos {

    public static class ProjectResponse {
        public Long id;
        public String code;
        public String name;
        public Integer clientId;
        public String clientName;
        public String ownerName;
        public BigDecimal budgetTotal;
        public Integer progress;
        public String status;
        public LocalDate startDate;
        public LocalDate endDate;
        public LocalDateTime createdAt;
    }

    public static class CreateProjectRequest {
        public String name;
        public Integer clientId;
        public String ownerName;
        public BigDecimal budgetTotal;
        public Integer progress;
        public String status;
        public LocalDate startDate;
        public LocalDate endDate;
    }

    public static class UpdateProjectRequest {
        public String name;
        public Integer clientId;
        public String ownerName;
        public BigDecimal budgetTotal;
        public Integer progress;
        public String status;
        public LocalDate startDate;
        public LocalDate endDate;
    }
}
