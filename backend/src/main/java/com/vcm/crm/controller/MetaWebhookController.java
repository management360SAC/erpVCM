package com.vcm.crm.controller;

import com.vcm.crm.service.MetaIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/webhooks/meta")
@RequiredArgsConstructor
public class MetaWebhookController {

    private final MetaIntegrationService service;

    /**
     * Meta verifies the webhook by sending a GET with hub.mode, hub.challenge, hub.verify_token.
     * If verify_token matches, we echo back hub.challenge.
     */
    @GetMapping
    public ResponseEntity<String> verify(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.challenge") String challenge,
            @RequestParam("hub.verify_token") String verifyToken) {

        if (service.verifyWebhook(mode, challenge, verifyToken)) {
            log.info("Meta webhook verified for mode={}", mode);
            return ResponseEntity.ok(challenge);
        }
        log.warn("Meta webhook verification failed: invalid verify_token");
        return ResponseEntity.status(403).body("Forbidden");
    }

    /**
     * Meta sends lead events as POST requests.
     */
    @PostMapping
    public ResponseEntity<String> receive(@RequestBody String body) {
        log.info("Meta webhook event received");
        service.processWebhookEvent(body);
        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}
