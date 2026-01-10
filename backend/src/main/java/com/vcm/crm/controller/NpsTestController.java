package com.vcm.crm.controller;

import com.vcm.crm.service.NpsAutoInviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test/nps")
@RequiredArgsConstructor
public class NpsTestController {

    private final NpsAutoInviteService autoInviteService;

    @PostMapping("/run")
    public String run() {
        autoInviteService.sendDailyNpsInvites();
        return "OK → NPS Auto-Invite ejecutado manualmente";
    }
}
