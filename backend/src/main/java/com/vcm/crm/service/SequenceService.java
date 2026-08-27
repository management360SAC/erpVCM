package com.vcm.crm.service;

import com.vcm.crm.entity.SequenceCounter;
import com.vcm.crm.repository.SequenceCounterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

/** Generador genérico de códigos correlativos por año, ej. PRY-2026-0001, CRG-2026-0001. */
@Service
public class SequenceService {

    private final SequenceCounterRepository repo;

    public SequenceService(SequenceCounterRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public synchronized String next(String prefix, int padding) {
        int year = Year.now().getValue();
        String key = prefix + "-" + year;

        SequenceCounter counter = repo.findById(key).orElseGet(() -> {
            SequenceCounter s = new SequenceCounter();
            s.setSeqKey(key);
            s.setNextVal(1);
            return s;
        });

        int n = counter.getNextVal();
        counter.setNextVal(n + 1);
        repo.save(counter);

        String pattern = "%0" + padding + "d";
        return prefix + "-" + year + "-" + String.format(pattern, n);
    }
}
