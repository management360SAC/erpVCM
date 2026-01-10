package com.vcm.crm.repository;

import com.vcm.crm.domain.quote.Quote;
import com.vcm.crm.domain.quote.QuoteStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuoteRepository extends JpaRepository<Quote, Long> {

  @Query(
      "SELECT q FROM Quote q " +
      "WHERE (:text IS NULL OR :text = '' OR LOWER(q.number) LIKE LOWER(CONCAT('%', :text, '%'))) " +
      "AND (:status IS NULL OR q.status = :status) " +
      "AND (:sector IS NULL OR q.sector = :sector) " +
      "AND (:clientId IS NULL OR q.clientId = :clientId)"
  )
  Page<Quote> search(
      @Param("text") String text,
      @Param("status") QuoteStatus status,
      @Param("sector") String sector,
      @Param("clientId") Long clientId,
      Pageable pageable
  );
  
}
