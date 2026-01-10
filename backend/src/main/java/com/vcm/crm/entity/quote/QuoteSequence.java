package com.vcm.crm.domain.quote;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Data
@Entity
@Table(name = "quote_sequence")
public class QuoteSequence {
    @Id
    private Integer seqYear;
    private Integer nextVal;
}
