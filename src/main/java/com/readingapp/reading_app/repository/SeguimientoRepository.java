package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Seguimiento;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SeguimientoRepository extends JpaRepository<Seguimiento, Long> {
    List<Seguimiento> findByUsuarioIdusuario(Long idusuario);
    List<Seguimiento> findByUsuarioIdusuarioAndLibroIdlibro(Long idusuario, Long idlibro);
    List<Seguimiento> findByUsuarioIdusuarioAndEstado(Long idusuario, EstadoLectura estado);
    Optional<Seguimiento> findTopByUsuarioIdusuarioAndLibroIdlibroOrderByFechaDesc(Long idusuario, Long idlibro);
    @Query(value = "SELECT COALESCE(SUM(diff), 0) FROM (" +
            "  SELECT GREATEST(s.num_pagina - COALESCE(LAG(s.num_pagina) OVER (" +
            "    PARTITION BY s.idusuario, s.idlibro ORDER BY s.idseguimiento" +
            "  ), 0), 0) AS diff" +
            "  FROM seguimiento s" +
            "  WHERE s.idusuario = :uid" +
            ") sub", nativeQuery = true)
    Integer sumPaginasByUsuario(@Param("uid") Long uid);
    Long countByUsuarioIdusuarioAndEstado(Long idusuario, EstadoLectura estado);
    @Query("SELECT COUNT(s) FROM Seguimiento s WHERE s.usuario.idusuario = :uid AND s.libro.autor.idautor = :aid AND s.estado = :estado")
    Long countByUsuarioIdusuarioAndLibroAutorIdautorAndEstado(@Param("uid") Long uid, @Param("aid") Long aid, @Param("estado") EstadoLectura estado);
    @Query("SELECT COUNT(DISTINCT s.libro.idlibro) FROM Seguimiento s " +
            "WHERE s.usuario.idusuario = :idusuario AND s.estado = 'LEYENDO' " +
            "AND s.idseguimiento = (SELECT MAX(s2.idseguimiento) FROM Seguimiento s2 " +
            "WHERE s2.usuario.idusuario = s.usuario.idusuario " +
            "AND s2.libro.idlibro = s.libro.idlibro)")
    long countLibrosLeyendoActualmente(@Param("idusuario") Long idusuario);
    Optional<Seguimiento> findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(
            Long idusuario, Long idlibro);
    long countByUsuarioIdusuarioAndLibroIdlibroAndEstado(Long idusuario, Long idlibro, EstadoLectura estado);
    @Query("SELECT s FROM Seguimiento s WHERE s.usuario.idusuario = :idusuario " +
            "AND s.estado = 'LEYENDO' " +
            "AND s.idseguimiento = (SELECT MAX(s2.idseguimiento) FROM Seguimiento s2 " +
            "WHERE s2.usuario.idusuario = s.usuario.idusuario " +
            "AND s2.libro.idlibro = s.libro.idlibro)")
    List<Seguimiento> findLibrosLeyendoActualmente(@Param("idusuario") Long idusuario);
}
