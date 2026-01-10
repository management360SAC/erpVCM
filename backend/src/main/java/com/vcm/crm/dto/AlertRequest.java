package com.vcm.crm.dto;

import lombok.Data;

@Data
public class AlertRequest {
    private String title;
    private String message;
    private Integer userId;
}