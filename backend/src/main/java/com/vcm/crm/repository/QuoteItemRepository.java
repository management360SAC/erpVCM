package com.vcm.crm.repository;

import com.vcm.crm.domain.quote.QuoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository


public interface QuoteItemRepository extends JpaRepository<QuoteItem, Long> {
    List<QuoteItem> findByQuoteId(Long quoteId);
}
