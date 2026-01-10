// backend/src/main/java/com/vcm/crm/service/UserServiceImpl.java
package com.vcm.crm.service;

import com.vcm.crm.dto.UserDtos.CreateUserRequest;
import com.vcm.crm.dto.UserDtos.UpdateUserRequest;
import com.vcm.crm.dto.UserDtos.UserResponse;
import com.vcm.crm.entity.Usuario;
import com.vcm.crm.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UsuarioRepository usuarioRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public List<UserResponse> list() {
    return usuarioRepository.findAll()
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Override
  public UserResponse get(Integer id) {
    Usuario u = usuarioRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    return toResponse(u);
  }

  @Override
  public UserResponse create(CreateUserRequest req) {
    Usuario u = new Usuario();
    u.setOrgId(req.getOrgId());
    u.setUsername(req.getUsername());
    u.setNombre(req.getName());
    u.setEmail(req.getEmail());
    u.setPassword(passwordEncoder.encode(req.getPassword()));
    u.setRol(req.getRole());
    u.setIsActive(req.getActive() != null ? req.getActive() : Boolean.TRUE);

    // extras
    u.setDireccion(req.getDireccion());
    u.setCelular(req.getCelular());
    u.setDni(req.getDni());
    u.setCargo(req.getCargo());
    u.setSexo(req.getSexo());                // 👈 aquí se guarda "M"/"F"
    u.setFechaDeAlta(req.getFechaDeAlta());

    u = usuarioRepository.save(u);
    return toResponse(u);
  }

  @Override
  public UserResponse update(Integer id, UpdateUserRequest req) {
    Usuario u = usuarioRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

    if (req.getName()        != null) u.setNombre(req.getName());
    if (req.getEmail()       != null) u.setEmail(req.getEmail());
    if (req.getRole()        != null) u.setRol(req.getRole());
    if (req.getActive()      != null) u.setIsActive(req.getActive());
    if (req.getDireccion()   != null) u.setDireccion(req.getDireccion());
    if (req.getCelular()     != null) u.setCelular(req.getCelular());
    if (req.getDni()         != null) u.setDni(req.getDni());
    if (req.getCargo()       != null) u.setCargo(req.getCargo());
    if (req.getSexo()        != null) u.setSexo(req.getSexo());          // 👈 aquí se actualiza
    if (req.getFechaDeAlta() != null) u.setFechaDeAlta(req.getFechaDeAlta());

    u = usuarioRepository.save(u);
    return toResponse(u);
  }

  @Override
  public void delete(Integer id) {
    usuarioRepository.deleteById(id);
  }

  @Override
  public void resetPasswordByUsername(String username, String newPassword) {
    Usuario u = usuarioRepository.findByUsername(username)
        .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    u.setPassword(passwordEncoder.encode(newPassword));
    usuarioRepository.save(u);
  }

  // ================== Mapper ==================
  private UserResponse toResponse(Usuario u) {
    UserResponse r = new UserResponse();
    r.setId(u.getId());                 // Integer -> Integer, sin Math.toIntExact
    r.setOrgId(u.getOrgId());
    r.setUsername(u.getUsername());
    r.setName(u.getNombre());
    r.setEmail(u.getEmail());
    r.setRole(u.getRol());
    r.setActive(u.getIsActive());

    r.setDireccion(u.getDireccion());
    r.setCelular(u.getCelular());
    r.setDni(u.getDni());
    r.setCargo(u.getCargo());
    r.setSexo(u.getSexo());            
    r.setFechaDeAlta(u.getFechaDeAlta());

    return r;
  }
}
