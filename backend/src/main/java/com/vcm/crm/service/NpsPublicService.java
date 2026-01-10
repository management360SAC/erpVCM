// src/main/java/com/vcm/crm/service/NpsPublicService.java
package com.vcm.crm.service;

import com.vcm.crm.entity.ClientService;
import com.vcm.crm.entity.NpsInvite;
import com.vcm.crm.entity.NpsResponse;
import com.vcm.crm.repository.NpsInviteRepository;
import com.vcm.crm.repository.NpsResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class NpsPublicService {

    private final NpsInviteRepository inviteRepository;
    private final NpsResponseRepository responseRepository;

    private static final ZoneId LIMA = ZoneId.of("America/Lima");

    public NpsInvite getInvite(String token) {
        return inviteRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invitación inválida o no encontrada"));
    }

    @Transactional
    public void registerAnswer(String token, int score, String comment) {
        NpsInvite invite = getInvite(token);
        LocalDateTime now = LocalDateTime.now(LIMA);

        // Validaciones básicas
        if (invite.getExpiresAt() != null && invite.getExpiresAt().isBefore(now)) {
            throw new IllegalStateException("La invitación está vencida.");
        }
        if (invite.getStatus() == NpsInvite.Status.RESPONDED) {
            throw new IllegalStateException("Esta invitación ya fue respondida.");
        }

        ClientService cs = invite.getClientService();
        if (cs == null || cs.getId() == null) {
            throw new IllegalStateException("La invitación no está asociada a un servicio válido.");
        }

        // 👉 AQUÍ es donde se setean los campos obligatorios
        NpsResponse response = NpsResponse.builder()
                .clientService(cs)   // esto rellena client_service_id
                .score(score)        // obligatorio
                .comment(comment)
                .build();

        responseRepository.save(response);

        // Actualizamos la invitación
        invite.setStatus(NpsInvite.Status.RESPONDED);
        invite.setRespondedAt(now);
        invite.setUpdatedAt(now);
        inviteRepository.save(invite);
    }
}
