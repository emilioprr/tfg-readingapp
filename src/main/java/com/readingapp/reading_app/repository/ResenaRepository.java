package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Resena;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResenaRepository extends JpaRepository<Resena, Long> {
    Page<Resena> findByUsuarioIdusuario(Long idusuario, Pageable pageable);
    Page<Resena> findByLibroIdlibro(Long idlibro, Pageable pageable);
    Page<Resena> findByEsPublicaTrue(Pageable pageable);
    Optional<Resena> findByUsuarioIdusuarioAndLibroIdlibro(Long idusuario, Long idlibro);
}