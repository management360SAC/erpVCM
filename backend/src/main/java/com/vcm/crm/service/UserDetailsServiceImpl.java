package com.vcm.crm.service;

import com.vcm.crm.entity.Usuario;
import com.vcm.crm.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

  private final UsuarioRepository usuarioRepository;

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    Usuario u = usuarioRepository.findByUsername(username)
        .orElseThrow(() -> new UsernamePasswordAuthenticationException("Usuario no encontrado: " + username));

    String rol = (u.getRol() == null || u.getRol().trim().isEmpty()) ? "USER" : u.getRol().trim().toUpperCase();
    List<SimpleGrantedAuthority> auths =
        Arrays.asList(new SimpleGrantedAuthority("ROLE_" + rol));

    return new org.springframework.security.core.userdetails.User(
        u.getUsername(), u.getPassword(),
        u.getIsActive() != null ? u.getIsActive() : true,
        true, true, true,
        auths
    );
  }

  private static class UsernamePasswordAuthenticationException extends UsernameNotFoundException {
    public UsernamePasswordAuthenticationException(String msg){ super(msg); }
  }
}
