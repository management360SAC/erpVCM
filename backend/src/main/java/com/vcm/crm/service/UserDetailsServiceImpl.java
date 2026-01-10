package com.vcm.crm.service;

import com.vcm.crm.entity.Usuario;
import com.vcm.crm.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
  private final UsuarioRepository usuarioRepository;

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    Usuario u = usuarioRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

    String rol = (u.getRol() == null || u.getRol().trim().isEmpty())
        ? "USER" : u.getRol().trim().toUpperCase();

    List<GrantedAuthority> auths =
        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + rol));

    boolean enabled = u.getIsActive() == null ? true : u.getIsActive();

    return new org.springframework.security.core.userdetails.User(
        u.getUsername(), u.getPassword(),
        enabled, true, true, true, auths
    );
  }
}
