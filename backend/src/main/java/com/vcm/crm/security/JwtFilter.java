package com.vcm.crm.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

  private final JwtUtil jwtUtil;
  private final UserDetailsService userDetailsService;

  @Override
  protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain chain) throws ServletException, IOException {

    // ¡IMPORTANTE! Esto NO incluye el context-path (/api). Perfecto para nuestros matchers.
    final String path = request.getServletPath();
    final String method = request.getMethod();

    // 1) Deja pasar endpoints públicos sin tocar el contexto de seguridad.
    if (isPublic(path, method)) {
      chain.doFilter(request, response);
      return;
    }

    // 2) Requiere Authorization: Bearer <token> para el resto.
    String auth = request.getHeader("Authorization");
    if (auth == null || !auth.startsWith("Bearer ")) {
      chain.doFilter(request, response);
      return;
    }

    String token = auth.substring(7);
    try {
      // JJWT 0.11.x -> parse() devuelve Jws<Claims>
      Jws<Claims> jws = jwtUtil.parse(token);
      String username = jws.getBody().getSubject();

      if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        UserDetails user = userDetailsService.loadUserByUsername(username);
        if (jwtUtil.isValid(token, user)) {
          UsernamePasswordAuthenticationToken authToken =
              new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
          SecurityContextHolder.getContext().setAuthentication(authToken);
        }
      }
    } catch (Exception ignored) {
      // Token inválido/expirado: no autenticamos; caerá en 401/403 si la ruta es privada.
    }

    chain.doFilter(request, response);
  }

  /**
   * Rutas públicas (sin /api porque usamos getServletPath()).
   */
  private boolean isPublic(String path, String method) {
    if (path == null) return false;

    // ping y actuator
    if (path.equals("/ping") || path.equals("/actuator") || path.startsWith("/actuator/")) {
      return true;
    }

    // auth (login / refresh, etc.)
    if (path.equals("/auth") || path.startsWith("/auth/")) {
      return true;
    }

    // reset de contraseña (solo POST)
    if ("POST".equalsIgnoreCase(method) && path.equals("/users/reset-password")) {
      return true;
    }

    return false;
  }
}
