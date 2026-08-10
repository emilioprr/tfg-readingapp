package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Lista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ListaRepository extends JpaRepository<Lista, Long> {
    List<Lista> findByUsuarioIdusuario(Long idusuario);
    List<Lista> findByEsPublicaTrueAndEsAutomaticaFalse();
}
