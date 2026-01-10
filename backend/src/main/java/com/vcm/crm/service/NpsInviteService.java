package com.vcm.crm.service;

import com.vcm.crm.dto.NpsInviteDtos.*;
import com.vcm.crm.entity.ClientService;
import com.vcm.crm.entity.NpsInvite;
import com.vcm.crm.repository.ClientServiceRepository;
import com.vcm.crm.repository.NpsInviteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class NpsInviteService {

  private final NpsInviteRepository inviteRepo;
  private final ClientServiceRepository clientServiceRepo;

  private static final SecureRandom RNG = new SecureRandom();
  private static final ZoneId LIMA = ZoneId.of("America/Lima");

  private String randomToken() {
    byte[] bytes = new byte[16];
    RNG.nextBytes(bytes);
    StringBuilder sb = new StringBuilder(bytes.length * 2);
    for (byte b : bytes) {
      int v = b & 0xFF;
      if (v < 16) sb.append('0');
      sb.append(Integer.toHexString(v));
    }
    return sb.toString();
  }

  /**
   * Crear invitación NPS para un ClientService específico.
   * publicBaseUrl recomendado en dev: "http://localhost:5173/nps"
   */
  @Transactional
  public InviteInfo createInvite(CreateInviteRequest req, String publicBaseUrl) {
    ClientService cs = clientServiceRepo.findById(req.getClientServiceId())
        .orElseThrow(() -> new NoSuchElementException("ClientService no existe: " + req.getClientServiceId()));

    // Generar token único
    String token;
    int tries = 0;
    do {
      token = randomToken();
      tries++;
      if (tries > 5) throw new IllegalStateException("No se pudo generar token único para NPS.");
    } while (inviteRepo.existsByToken(token));

    LocalDateTime now = LocalDateTime.now(LIMA);
    NpsInvite invite = NpsInvite.builder()
        .clientService(cs)
        .email(req.getEmail())
        .token(token)
        .sentAt(now)
        .expiresAt(now.plusDays(30))  // 30 días de validez
        .status(NpsInvite.Status.SENT)
        .build();

    invite = inviteRepo.save(invite);

    // 👉 IMPORTANTE: URL pública con query param ?token=
    // Si publicBaseUrl = "http://localhost:5173/nps" → queda "http://localhost:5173/nps?token=XXXX"
    String publicUrl = publicBaseUrl + "?token=" + token;

    String serviceName = (cs.getService() != null && cs.getService().getName() != null)
        ? cs.getService().getName()
        : "nuestro servicio";

    String clientName = cs.getClient() != null ? cs.getClient().getLegalName() : null;

    return InviteInfo.builder()
        .id(invite.getId())
        .email(invite.getEmail())
        .token(invite.getToken())
        .publicUrl(publicUrl)
        .sentAt(invite.getSentAt())
        .expiresAt(invite.getExpiresAt())
        .status(invite.getStatus().name())
        .serviceName(serviceName)
        .clientName(clientName)
        .build();
  }

  /**
   * Usado por el controller público para mostrar info al abrir el link.
   */
  @Transactional(readOnly = true)
  public InviteInfo getInvite(String token) {
    NpsInvite invite = inviteRepo.findByToken(token)
        .orElseThrow(() -> new NoSuchElementException("Invitación NPS no encontrada: " + token));

    // Validar expiración
    if (invite.getExpiresAt() != null &&
        LocalDateTime.now(LIMA).isAfter(invite.getExpiresAt())) {
      throw new IllegalStateException("La invitación ha expirado");
    }

    ClientService cs = invite.getClientService();

    String serviceName = (cs != null && cs.getService() != null && cs.getService().getName() != null)
        ? cs.getService().getName()
        : "nuestro servicio";

    String clientName = (cs != null && cs.getClient() != null)
        ? cs.getClient().getLegalName()
        : null;

    return InviteInfo.builder()
        .id(invite.getId())
        .email(invite.getEmail())
        .token(invite.getToken())
        .sentAt(invite.getSentAt())
        .expiresAt(invite.getExpiresAt())
        .respondedAt(invite.getRespondedAt())
        .status(invite.getStatus().name())
        .serviceName(serviceName)
        .clientName(clientName)
        .build();
  }

  /**
   * Guardar la respuesta pública (desde el link del cliente).
   */
  @Transactional
  public void answer(PublicAnswerRequest req) {
    NpsInvite inv = inviteRepo.findByToken(req.getToken())
        .orElseThrow(() -> new NoSuchElementException("Invitación NPS no encontrada: " + req.getToken()));

    // Validar expiración
    if (inv.getExpiresAt() != null &&
        LocalDateTime.now(LIMA).isAfter(inv.getExpiresAt())) {
      throw new IllegalStateException("La invitación ha expirado");
    }

    // Validar que no haya sido respondida antes
    if (inv.getStatus() == NpsInvite.Status.RESPONDED) {
      throw new IllegalStateException("La invitación ya fue respondida");
    }

    inv.setRespondedAt(LocalDateTime.now(LIMA));
    inv.setStatus(NpsInvite.Status.RESPONDED);

    // Si tu entidad NpsInvite tiene score/comment:
    // inv.setScore(req.getScore());
    // inv.setComment(req.getComment());

    inviteRepo.save(inv);

    // Si más adelante quieres otra tabla de respuestas detalladas:
    // npsResponseRepo.save(new NpsResponse(inv, req.getScore(), req.getComment()));
  }

  @Transactional
  public void markResponded(String token) {
    NpsInvite inv = inviteRepo.findByToken(token)
        .orElseThrow(() -> new NoSuchElementException("Invitación NPS no encontrada para token: " + token));

    inv.setRespondedAt(LocalDateTime.now(LIMA));
    inv.setStatus(NpsInvite.Status.RESPONDED);
    inviteRepo.save(inv);
  }

  @Transactional(readOnly = true)
  public NpsInvite getByToken(String token) {
    return inviteRepo.findByToken(token)
        .orElseThrow(() -> new NoSuchElementException("Invitación NPS no encontrada: " + token));
  }
}
