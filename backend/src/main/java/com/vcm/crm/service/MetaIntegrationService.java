package com.vcm.crm.service;

import com.vcm.crm.dto.MetaIntegrationDtos.MetaConnectRequest;
import com.vcm.crm.dto.MetaIntegrationDtos.MetaStatusResponse;
import com.vcm.crm.entity.MetaIntegration;

public interface MetaIntegrationService {
    MetaStatusResponse getStatus(Integer orgId);
    MetaStatusResponse connect(Integer orgId, MetaConnectRequest req);
    void disconnect(Integer orgId);
    void processWebhookEvent(String body);
    boolean verifyWebhook(String mode, String challenge, String verifyToken);
}
