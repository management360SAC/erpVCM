package com.vcm.crm.dto;

import com.vcm.crm.model.LeadStatus;

import javax.validation.constraints.NotNull;

public class UpdateLeadStatusRequest {

    @NotNull
    private LeadStatus status;

    public LeadStatus getStatus() {
        return status;
    }

    public void setStatus(LeadStatus status) {
        this.status = status;
    }
}
