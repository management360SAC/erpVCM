package com.vcm.crm.service;

import com.vcm.crm.domain.quote.QuoteSequence;
import com.vcm.crm.repo.QuoteSequenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.NoSuchElementException;

@Service
public class QuoteNumberService {

    private final QuoteSequenceRepository seqRepo;

    public QuoteNumberService(QuoteSequenceRepository seqRepo) {
        this.seqRepo = seqRepo;
    }

    @Transactional
    public String nextNumber() {
        int year = Year.now().getValue();
        QuoteSequence seq = seqRepo.findById(year).orElseGet(() -> {
            QuoteSequence s = new QuoteSequence();
            s.setSeqYear(year);
            s.setNextVal(1);
            return seqRepo.save(s);
        });
        int n = seq.getNextVal();
        seq.setNextVal(n + 1);
        seqRepo.save(seq);
        return String.format("COT-%d-%03d", year, n);
    }
}
