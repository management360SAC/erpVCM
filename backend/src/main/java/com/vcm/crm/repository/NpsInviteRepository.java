// src/main/java/com/vcm/crm/repository/NpsInviteRepository.java
package com.vcm.crm.repository;

import com.vcm.crm.entity.NpsInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NpsInviteRepository extends JpaRepository<NpsInvite, Integer> {

  Optional<NpsInvite> findByToken(String token);

  boolean existsByToken(String token);

  // para auto-invites si los usas
  List<NpsInvite> findByStatus(NpsInvite.Status status);

  List<NpsInvite> findByStatusAndExpiresAtBefore(
      NpsInvite.Status status,
      LocalDateTime expiresBefore
  );
}
