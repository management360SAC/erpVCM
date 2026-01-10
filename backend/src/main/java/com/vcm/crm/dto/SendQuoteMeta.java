package com.vcm.crm.dto;

public class SendQuoteMeta {

    private Integer orgId;
    private String sector;
    private Long relatedDealId; // id del deal en el embudo (puede ser null)

    public Integer getOrgId() {
        return orgId;
    }

    public void setOrgId(Integer orgId) {
        this.orgId = orgId;
    }

    public String getSector() {
        return sector;
    }

    public void setSector(String sector) {
        this.sector = sector;
    }

    public Long getRelatedDealId() {
        return relatedDealId;
    }

    public void setRelatedDealId(Long relatedDealId) {
        this.relatedDealId = relatedDealId;
    }
}
