package com.vcm.crm.dto;

import lombok.Data;

public class MetaIntegrationDtos {

    @Data
    public static class MetaStatusResponse {
        private Integer id;
        private String status;
        private String pageId;
        private String pageName;
        private String verifyToken;
        private String lastSyncAt;
        private String webhookUrl;
    }

    @Data
    public static class MetaConnectRequest {
        private String pageId;
        private String pageName;
        private String pageAccessToken;
        private String verifyToken;
    }
}
