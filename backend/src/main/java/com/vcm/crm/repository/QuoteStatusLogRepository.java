package com.vcm.crm.repository;

import com.vcm.crm.entity.quote.QuoteStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuoteStatusLogRepository extends JpaRepository<QuoteStatusLog, Long> {
    
    List<QuoteStatusLog> findByQuoteIdOrderByChangedAtDesc(Long quoteId);
    
    List<QuoteStatusLog> findTop10ByOrderByChangedAtDesc();
}