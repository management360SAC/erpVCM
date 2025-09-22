package com.vcm.crm.controller;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bcrypt")
public class BcryptController {
  private final BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
  @GetMapping("/hash")
  public String hash(@RequestParam String s){ return enc.encode(s); }
}
