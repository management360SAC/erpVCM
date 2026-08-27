package com.vcm.crm.entity;

import javax.persistence.*;

@Entity
@Table(name = "sequence_counters")
public class SequenceCounter {

    @Id
    @Column(name = "seq_key", length = 40)
    private String seqKey;

    @Column(name = "next_val", nullable = false)
    private Integer nextVal;

    public String getSeqKey() { return seqKey; }
    public void setSeqKey(String seqKey) { this.seqKey = seqKey; }

    public Integer getNextVal() { return nextVal; }
    public void setNextVal(Integer nextVal) { this.nextVal = nextVal; }
}
