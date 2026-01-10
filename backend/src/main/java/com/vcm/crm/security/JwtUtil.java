package com.vcm.crm.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

  private final SecretKey key;

  // TTL por defecto (ajústalos si quieres)
  private static final long ACCESS_TTL_MS  = 60 * 60 * 1000L;          // 60 minutos
  private static final long REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000L;  // 7 días

  public JwtUtil(@Value("${app.jwt.secret}") String secret) {
    // secreto >= 32 chars
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  /** Genera un token con subject=username y ttl en milisegundos */
  public String generateToken(String username, long ttlMillis) {
    long now = System.currentTimeMillis();
    return Jwts.builder()
        .setSubject(username)
        .setIssuedAt(new Date(now))
        .setExpiration(new Date(now + ttlMillis))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  /** Atajos usados por AuthController */
  public String generateAccessToken(String username) {
    return generateToken(username, ACCESS_TTL_MS);
  }
  public String generateRefreshToken(String username) {
    return generateToken(username, REFRESH_TTL_MS);
  }

  /** Parsea y valida firma; lanza excepción si es inválido/expirado */
  public Jws<Claims> parse(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token);
  }

  /** Devuelve el subject (username) o null si algo falla */
  public String getSubject(String token) {
    try {
      return parse(token).getBody().getSubject();
    } catch (JwtException | IllegalArgumentException e) {
      return null;
    }
  }

  /** Verifica usuario y expiración contra UserDetails */
  public boolean isValid(String token, UserDetails user) {
    try {
      Claims c = parse(token).getBody();
      String sub = c.getSubject();
      Date exp = c.getExpiration();
      return sub != null
          && user != null
          && sub.equals(user.getUsername())
          && exp != null
          && exp.after(new Date());
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }
}
