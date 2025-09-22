package com.vcm.crm.service;

import com.vcm.crm.dto.UserDtos.CreateUserRequest;
import com.vcm.crm.dto.UserDtos.UpdateUserRequest;
import com.vcm.crm.dto.UserDtos.UserResponse;
import com.vcm.crm.entity.Usuario;
import com.vcm.crm.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UsuarioRepository usuarioRepository;
  private final BCryptPasswordEncoder passwordEncoder;

  // ---------- Queries ----------
  public List<UserResponse> list() {
    return usuarioRepository.findAll()
        .stream()
        .map(this::toDto)
        .collect(Collectors.toList());
  }

  public UserResponse get(Integer id) {
    Usuario u = usuarioRepository.findById(id)
        .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
    return toDto(u);
  }

  // ---------- Commands ----------
  @Transactional
  public UserResponse create(CreateUserRequest req) {
    validateNotBlank(req.getUsername(), "username requerido");
    validateNotBlank(req.getPassword(), "password requerido");

    if (usuarioRepository.existsByUsername(req.getUsername())) {
      throw new IllegalArgumentException("Username ya existe");
    }

    Usuario u = new Usuario();
    u.setOrgId(req.getOrgId());
    u.setUsername(req.getUsername());
    u.setPassword(passwordEncoder.encode(req.getPassword()));
    u.setNombre(req.getNombre());
    u.setRol(req.getRol());
    u.setEmail(req.getEmail());
    u.setDireccion(req.getDireccion());
    u.setCelular(req.getCelular());
    u.setIsActive(req.getIsActive() != null ? req.getIsActive() : Boolean.TRUE);

    Usuario saved = usuarioRepository.save(u);
    return toDto(saved);
  }

  @Transactional
  public UserResponse update(Integer id, UpdateUserRequest req) {
    Usuario u = usuarioRepository.findById(id)
        .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));

    if (notBlank(req.getNombre()))    u.setNombre(req.getNombre());
    if (notBlank(req.getRol()))       u.setRol(req.getRol());
    if (notBlank(req.getEmail()))     u.setEmail(req.getEmail());
    if (notBlank(req.getDireccion())) u.setDireccion(req.getDireccion());
    if (notBlank(req.getCelular()))   u.setCelular(req.getCelular());
    if (req.getIsActive() != null)    u.setIsActive(req.getIsActive());
    if (notBlank(req.getNewPassword())) {
      u.setPassword(passwordEncoder.encode(req.getNewPassword()));
    }

    Usuario saved = usuarioRepository.save(u);
    return toDto(saved);
  }

  @Transactional
  public void delete(Integer id) {
    if (!usuarioRepository.existsById(id)) {
      throw new NoSuchElementException("Usuario no encontrado");
    }
    usuarioRepository.deleteById(id);
  }

  // ---------- Reset público ----------
  @Transactional
  public void resetPasswordByUsername(String username, String newPassword) {
    validateNotBlank(username, "username requerido");
    validateNotBlank(newPassword, "newPassword requerido");
    if (newPassword.length() < 8) throw new IllegalArgumentException("Contraseña mínima 8 caracteres");

    Usuario u = usuarioRepository.findByUsername(username)
        .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));

    u.setPassword(passwordEncoder.encode(newPassword));
    usuarioRepository.save(u);
  }

  // ---------- Helpers ----------
  private UserResponse toDto(Usuario u) {
    UserResponse dto = new UserResponse();
    dto.setId(u.getId());
    dto.setOrgId(u.getOrgId());
    dto.setUsername(u.getUsername());
    dto.setNombre(u.getNombre());
    dto.setRol(u.getRol());
    dto.setEmail(u.getEmail());
    dto.setDireccion(u.getDireccion());
    dto.setCelular(u.getCelular());
    dto.setIsActive(u.getIsActive());
    return dto;
  }

  private static boolean notBlank(String s) {
    return s != null && !s.trim().isEmpty();
  }
  private static void validateNotBlank(String s, String message) {
    if (!notBlank(s)) throw new IllegalArgumentException(message);
  }
}
