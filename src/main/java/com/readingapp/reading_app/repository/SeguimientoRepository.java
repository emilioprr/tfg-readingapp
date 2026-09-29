package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Seguimiento;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
    Long sumPaginasByUsuario(@Param("uid") Long uid);

    @Query(value = "SELECT COALESCE(SUM(diff), 0) FROM (" +
            "  SELECT fecha, GREATEST(s.num_pagina - COALESCE(LAG(s.num_pagina) OVER (" +
            "    PARTITION BY s.idusuario, s.idlibro ORDER BY s.idseguimiento" +
            "  ), 0), 0) AS diff" +
            "  FROM seguimiento s" +
            "  WHERE s.idusuario = :uid" +
            ") sub WHERE fecha BETWEEN :inicio AND :fin", nativeQuery = true)
    Long sumPaginasByUsuarioEntreFechas(@Param("uid") Long uid, @Param("inicio") LocalDate inicio, @Param("fin") LocalDate fin);

    Long countByUsuarioIdusuarioAndEstado(Long idusuario, EstadoLectura estado);
    /** Para los retos: las lecturas antiguas (marcadas al puntuar) no cuentan. */
    @Query("SELECT COUNT(s) FROM Seguimiento s WHERE s.usuario.idusuario = :idusuario AND s.estado = :estado " +
            "AND s.lecturaAntigua = false AND s.fecha BETWEEN :inicio AND :fin")
    Long countByUsuarioIdusuarioAndEstadoAndFechaBetween(@Param("idusuario") Long idusuario, @Param("estado") EstadoLectura estado,
                                                         @Param("inicio") LocalDate inicio, @Param("fin") LocalDate fin);

    @Query("SELECT COUNT(s) FROM Seguimiento s WHERE s.usuario.idusuario = :uid AND s.libro.autor.idautor = :aid AND s.estado = :estado")
    Long countByUsuarioIdusuarioAndLibroAutorIdautorAndEstado(@Param("uid") Long uid, @Param("aid") Long aid, @Param("estado") EstadoLectura estado);

    @Query("SELECT COUNT(s) FROM Seguimiento s WHERE s.usuario.idusuario = :uid AND s.libro.autor.idautor = :aid AND s.estado = :estado AND s.lecturaAntigua = false AND s.fecha BETWEEN :inicio AND :fin")
    Long countByUsuarioIdusuarioAndLibroAutorIdautorAndEstadoAndFechaBetween(@Param("uid") Long uid, @Param("aid") Long aid, @Param("estado") EstadoLectura estado, @Param("inicio") LocalDate inicio, @Param("fin") LocalDate fin);

    @Query("SELECT COUNT(DISTINCT s.libro.idlibro) FROM Seguimiento s " +
            "WHERE s.usuario.idusuario = :idusuario AND s.estado = 'LEYENDO' " +
            "AND s.idseguimiento = (SELECT MAX(s2.idseguimiento) FROM Seguimiento s2 " +
            "WHERE s2.usuario.idusuario = s.usuario.idusuario " +
            "AND s2.libro.idlibro = s.libro.idlibro)")
    long countLibrosLeyendoActualmente(@Param("idusuario") Long idusuario);

    Optional<Seguimiento> findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(
            Long idusuario, Long idlibro);

    long countByUsuarioIdusuarioAndLibroIdlibroAndEstado(Long idusuario, Long idlibro, EstadoLectura estado);

    /**
     * Momentos destacados de las personas que sigue un usuario, para su feed de actividad:
     * empezar un libro (LEYENDO en la página 0), terminarlo y añadirlo a "Quiero leer".
     * Los avances de página no se incluyen para no llenar el feed.
     */
    @Query("SELECT s FROM Seguimiento s WHERE s.usuario IN " +
            "(SELECT seg FROM Usuario u JOIN u.seguidos seg WHERE u.idusuario = :idusuario) " +
            "AND s.fecha >= :desde AND s.lecturaAntigua = false " +
            "AND (s.estado = 'LEIDO' OR s.estado = 'PENDIENTE' OR (s.estado = 'LEYENDO' AND s.numPagina = 0)) " +
            "ORDER BY s.fecha DESC, s.idseguimiento DESC")
    List<Seguimiento> findActividadDeSeguidos(@Param("idusuario") Long idusuario, @Param("desde") LocalDate desde,
                                              org.springframework.data.domain.Pageable pageable);

    /** Libros cuyo estado ACTUAL (último seguimiento) es el indicado, del más reciente al más antiguo. */
    @Query("SELECT s FROM Seguimiento s WHERE s.usuario.idusuario = :idusuario " +
            "AND s.estado = :estado " +
            "AND s.idseguimiento = (SELECT MAX(s2.idseguimiento) FROM Seguimiento s2 " +
            "WHERE s2.usuario.idusuario = s.usuario.idusuario " +
            "AND s2.libro.idlibro = s.libro.idlibro) " +
            "ORDER BY s.idseguimiento DESC")
    List<Seguimiento> findLibrosEnEstadoActual(@Param("idusuario") Long idusuario, @Param("estado") EstadoLectura estado);
}
