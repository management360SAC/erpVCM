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

@RestController
@RequestMapping("/api/auth")   // 👈👈 CAMBIO IMPORTANTE
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;

    // ================================
    //              LOGIN
    // ================================
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {

        Authentication auth = authManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                req.getUsername(), req.getPassword()
            )
        );

        UserDetails ud = (UserDetails) auth.getPrincipal();

        // Buscar el usuario para devolver el ID
        Usuario u = usuarioRepository.findByUsername(ud.getUsername())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        LoginResponse resp = new LoginResponse();
        resp.setAccessToken(jwtUtil.generateAccessToken(ud.getUsername()));
        resp.setRefreshToken(jwtUtil.generateRefreshToken(ud.getUsername()));
        resp.setUsername(ud.getUsername());
        resp.setUserId(u.getId());

        return ResponseEntity.ok(resp);
    }

    // ================================
    //        DTOs del Request
    // ================================
    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    // ================================
    //        DTOs del Response
    // ================================
    @Data
    public static class LoginResponse {
        private String accessToken;
        private String refreshToken;
        private String username;
        private Integer userId;
    }
}
