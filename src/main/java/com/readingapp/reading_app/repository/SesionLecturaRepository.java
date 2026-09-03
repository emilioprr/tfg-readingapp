package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.SesionLectura;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SesionLecturaRepository extends JpaRepository<SesionLectura, Long> {

    Page<SesionLectura> findByUsuarioIdusuario(Long idusuario, Pageable pageable);

    List<SesionLectura> findByUsuarioIdusuarioAndLibroIdlibro(Long idusuario, Long idlibro);

    @Query("SELECT COALESCE(SUM(s.duracionMinutos), 0) FROM SesionLectura s WHERE s.usuario.idusuario = :uid")
    Integer sumMinutosByUsuario(@Param("uid") Long uid);

    @Query("SELECT COALESCE(SUM(s.duracionMinutos), 0) FROM SesionLectura s WHERE s.usuario.idusuario = :uid AND s.inicio BETWEEN :inicio AND :fin")
    Integer sumMinutosByUsuarioEntreFechas(@Param("uid") Long uid, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
}
