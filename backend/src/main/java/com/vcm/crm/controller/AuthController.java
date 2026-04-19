package com.vcm.crm.controller;

import com.vcm.crm.entity.Usuario;
import com.vcm.crm.repository.UsuarioRepository;
import com.vcm.crm.security.JwtUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            System.out.println(">>> ENTRE AL LOGIN");
            System.out.println(">>> username = " + req.getUsername());

            Usuario testUser = usuarioRepository.findByUsername(req.getUsername()).orElse(null);

            System.out.println(">>> USER FROM DB = " + (testUser != null ? testUser.getUsername() : "null"));
            System.out.println(">>> HASH FROM DB = " + (testUser != null ? testUser.getPassword() : "null"));
            System.out.println(">>> IS ACTIVE = " + (testUser != null ? testUser.getIsActive() : "null"));
            System.out.println(">>> ROLE = " + (testUser != null ? testUser.getRol() : "null"));
            System.out.println(">>> MATCHES = " + (testUser != null && passwordEncoder.matches(req.getPassword(), testUser.getPassword())));

            Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    req.getUsername(),
                    req.getPassword()
                )
            );

            System.out.println(">>> AUTH OK");

            UserDetails ud = (UserDetails) auth.getPrincipal();

            Usuario u = usuarioRepository.findByUsername(ud.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            LoginResponse resp = new LoginResponse();
            resp.setAccessToken(jwtUtil.generateAccessToken(ud.getUsername()));
            resp.setRefreshToken(jwtUtil.generateRefreshToken(ud.getUsername()));
            resp.setUsername(ud.getUsername());
            resp.setUserId(u.getId());

            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(e.getClass().getName() + ": " + e.getMessage());
        }
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
        private String username;
        private Integer userId;
    }
}