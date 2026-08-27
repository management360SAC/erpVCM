package com.vcm.crm.dto;

import java.time.LocalDateTime;

public class LeadFormDtos {

    public static class LeadFormResponse {
        public Integer id;
        public String name;
        public String slug;
        public Boolean active;
        public Long leadsCount;
        public LocalDateTime createdAt;
    }

    public static class CreateLeadFormRequest {
        public String name;
        public String slug; // opcional: se deriva de name si no se envía
        public Boolean active;
    }
}
