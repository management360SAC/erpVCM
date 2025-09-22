package com.vcm.crm.repository;

import com.vcm.crm.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
  boolean existsByUsername(String username);
  Optional<Usuario> findByUsername(String username);
  boolean existsByEmail(String email);
}
