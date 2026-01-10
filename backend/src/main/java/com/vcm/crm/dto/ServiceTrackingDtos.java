package com.vcm.crm.dto;

import lombok.Data;
import java.time.LocalDate;

public class ServiceTrackingDtos {

    @Data
    public static class Summary {
        private long totalActive;
        private long expiringSoon;
        private long expired;
        private int windowDays;
    }

    @Data
    public static class ExpiryRow {
        private Long clientServiceId;
        private Long clientId;
        private String clientName;
        private Long serviceId;
        private String serviceName;
        private LocalDate startDate;
        private LocalDate endDate;
        private boolean active;
        private long daysRemaining;
        private String severity;
    }
}