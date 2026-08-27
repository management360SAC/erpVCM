package com.vcm.crm.controller;

import com.vcm.crm.entity.Usuario;
import com.vcm.crm.repository.UsuarioRepository;
import com.vcm.crm.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jws;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    req.getUsername(),
                    req.getPassword()
                )
            );

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

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req) {
        String refreshToken = req.getRefreshToken();
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("refreshToken es requerido"));
        }

        Jws<Claims> jws;
        try {
            jws = jwtUtil.parse(refreshToken);
        } catch (JwtException | IllegalArgumentException e) {
            return ResponseEntity.status(401).body(new ErrorResponse("Refresh token inválido o expirado"));
        }

        String type = jws.getBody().get("type", String.class);
        if (!"refresh".equals(type)) {
            return ResponseEntity.status(401).body(new ErrorResponse("El token enviado no es un refresh token"));
        }

        String username = jws.getBody().getSubject();
        Usuario u = usuarioRepository.findByUsername(username).orElse(null);
        if (u == null || Boolean.FALSE.equals(u.getIsActive())) {
            return ResponseEntity.status(401).body(new ErrorResponse("Usuario no encontrado o inactivo"));
        }

        LoginResponse resp = new LoginResponse();
        resp.setAccessToken(jwtUtil.generateAccessToken(username));
        // El mismo refresh token sigue vigente hasta su propia expiración (7 días);
        // no se rota en cada uso para mantener esto simple.
        resp.setRefreshToken(refreshToken);
        resp.setUsername(username);
        resp.setUserId(u.getId());

        return ResponseEntity.ok(resp);
    }

    @Data
    public static class RefreshRequest {
        private String refreshToken;
    }

    @Data
    public static class ErrorResponse {
        private final String message;
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