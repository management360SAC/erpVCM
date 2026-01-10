// src/main/java/com/vcm/crm/controller/NpsPublicController.java
package com.vcm.crm.controller;

import com.vcm.crm.dto.NpsPublicDtos;
import com.vcm.crm.entity.NpsInvite;
import com.vcm.crm.repository.NpsInviteRepository;
import com.vcm.crm.service.NpsPublicService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/nps/public")
@RequiredArgsConstructor
public class NpsPublicController {

  private final NpsInviteRepository inviteRepo;
  private final NpsPublicService npsPublicService;

  @GetMapping("/invite/{token}")
  public ResponseEntity<?> getInvite(@PathVariable String token) {
    return inviteRepo.findByToken(token)
        .<ResponseEntity<?>>map(invite -> ResponseEntity.ok(
            new InviteInfo(
                invite.getToken(),
                invite.getClientName(),
                invite.getServiceName(),
                invite.getExpiresAt(),
                invite.getStatus() == NpsInvite.Status.RESPONDED
            )
        ))
        .orElseGet(() -> ResponseEntity.badRequest().body(
            new ErrorResponse("Invitación inválida o vencida.")
        ));
  }

  @PostMapping("/answer")
  public ResponseEntity<?> answer(@Valid @RequestBody NpsPublicDtos.AnswerRequest req) {
    try {
      npsPublicService.registerAnswer(req);
      return ResponseEntity.ok("OK");
    } catch (IllegalArgumentException | IllegalStateException ex) {
      return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }
  }

  @Data
  @AllArgsConstructor
  public static class InviteInfo {
    private String token;
    private String clientName;
    private String serviceName;
    private Object expiresAt;
    private boolean used;
  }

  @Data
  @AllArgsConstructor
  public static class ErrorResponse {
    private String message;
  }
}
