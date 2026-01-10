package com.vcm.crm.dto;

import java.util.List;

public class LeadStatsDTO {

    public static class BySource {
        private String source;
        private Long total;

        public BySource(String source, Long total) {
            this.source = source;
            this.total = total;
        }

        public String getSource() { return source; }
        public Long getTotal() { return total; }
    }

    public static class ByForm {
        private Long formId;
        private String formName;
        private Long total;

        public ByForm(Long formId, String formName, Long total) {
            this.formId = formId;
            this.formName = formName;
            this.total = total;
        }

        public Long getFormId() { return formId; }
        public String getFormName() { return formName; }
        public Long getTotal() { return total; }
    }

    private List<BySource> bySource;
    private List<ByForm> byForm;
    private Long total;

    public List<BySource> getBySource() { return bySource; }
    public void setBySource(List<BySource> bySource) { this.bySource = bySource; }

    public List<ByForm> getByForm() { return byForm; }
    public void setByForm(List<ByForm> byForm) { this.byForm = byForm; }

    public Long getTotal() { return total; }
    public void setTotal(Long total) { this.total = total; }
}
