package com.vcm.crm.controller;

import com.vcm.crm.dto.NpsInviteDtos.CreateInviteRequest;
import com.vcm.crm.dto.NpsInviteDtos.InviteInfo;
import com.vcm.crm.service.NpsInviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/nps/invites")
@RequiredArgsConstructor
public class NpsInviteController {

  private final NpsInviteService inviteService;

  @Value("${app.publicBaseUrl:http://localhost:5173}")
  private String publicBaseUrl;

  @PostMapping
  public InviteInfo create(@RequestBody CreateInviteRequest req) {
    return inviteService.createInvite(req, publicBaseUrl);
  }
}
