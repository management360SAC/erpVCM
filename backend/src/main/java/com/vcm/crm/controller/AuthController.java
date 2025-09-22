package com.vcm.crm.controller;

import com.vcm.crm.security.JwtUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth") 
@RequiredArgsConstructor
public class AuthController {

  private final AuthenticationManager authManager;
  private final JwtUtil jwtUtil;

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
    Authentication auth = authManager.authenticate(
        new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
    );
    UserDetails ud = (UserDetails) auth.getPrincipal();

    LoginResponse resp = new LoginResponse();
    resp.setAccessToken(jwtUtil.generateAccessToken(ud.getUsername()));
    resp.setRefreshToken(jwtUtil.generateRefreshToken(ud.getUsername()));
    return ResponseEntity.ok(resp);
  }

  @Data
  public static class LoginRequest {
    private String username;
    private String password;
  }

  @Data
  public static class LoginResponse {
    private String accessToken;
    private String refreshToken;
  }
}
