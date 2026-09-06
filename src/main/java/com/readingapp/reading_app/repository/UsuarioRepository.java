package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Usuario> findByNombreContainingIgnoreCase(String nombre);
    boolean existsByNombre(String nombre);
}

