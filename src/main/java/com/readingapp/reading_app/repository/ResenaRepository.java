package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Resena;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResenaRepository extends JpaRepository<Resena, Long> {
    List<Resena> findByUsuarioIdusuario(Long idusuario, Pageable pageable);
    List<Resena> findByLibroIdlibro(Long idlibro, Pageable pageable);
    List<Resena> findByEsPublicaTrue(Pageable pageable);
    Optional<Resena> findByUsuarioIdusuarioAndLibroIdlibro(Long idusuario, Long idlibro);
}