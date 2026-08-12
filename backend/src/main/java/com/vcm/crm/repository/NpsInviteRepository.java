package com.vcm.crm.repository;

import com.vcm.crm.entity.NpsInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NpsInviteRepository extends JpaRepository<NpsInvite, Integer> {

  Optional<NpsInvite> findByToken(String token);

  boolean existsByToken(String token);

  boolean existsByClientService_Id(Integer clientServiceId);

  List<NpsInvite> findByStatus(NpsInvite.Status status);

  List<NpsInvite> findByStatusAndExpiresAtBefore(
      NpsInvite.Status status,
      LocalDateTime expiresBefore
  );

  @Query("SELECT COUNT(i) FROM NpsInvite i WHERE i.sentAt BETWEEN :from AND :to")
  long countSentBetween(
      @Param("from") LocalDateTime from,
      @Param("to") LocalDateTime to
  );
}
