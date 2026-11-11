package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Anotacion;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnotacionRepository extends JpaRepository<Anotacion, Long> {
    List<Anotacion> findByUsuarioIdusuarioOrderByFechaDescIdanotacionDesc(Long idusuario, Pageable pageable);
    List<Anotacion> findByLibroIdlibro(Long idlibro, Pageable pageable);
    List<Anotacion> findByUsuarioIdusuarioAndLibroIdlibroOrderByFechaDescIdanotacionDesc(Long idusuario, Long idlibro);
    List<Anotacion> findByUsuarioIdusuarioAndTipo(Long idusuario, TipoAnotacion tipo, Pageable pageable);
    List<Anotacion> findByLibroIdlibroAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(Long idlibro, Pageable pageable);
    List<Anotacion> findByUsuarioIdusuarioAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(Long idusuario, Pageable pageable);
    List<Anotacion> findByUsuarioIdusuarioAndTipoAndEsPublicaTrue(Long idusuario, TipoAnotacion tipo, Pageable pageable);

    // === Muro de citas ===

    /** Citas públicas de toda la comunidad, las más recientes primero. */
    org.springframework.data.domain.Page<Anotacion> findByTipoAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(TipoAnotacion tipo, Pageable pageable);

    /**
     * Ids de las citas públicas, primero las que más likes han recibido desde :desde (la última semana)
     * y, a igualdad, las más recientes. Así las populares van rotando.
     */
    @Query(value = "SELECT a.idanotacion FROM Anotacion a LEFT JOIN LikeCita l ON l.anotacion = a AND l.fecha >= :desde " +
            "WHERE a.tipo = com.readingapp.reading_app.model.enums.TipoAnotacion.CITA AND a.esPublica = true " +
            "GROUP BY a.idanotacion, a.fecha ORDER BY COUNT(l) DESC, a.fecha DESC, a.idanotacion DESC",
            countQuery = "SELECT COUNT(a) FROM Anotacion a " +
                    "WHERE a.tipo = com.readingapp.reading_app.model.enums.TipoAnotacion.CITA AND a.esPublica = true")
    org.springframework.data.domain.Page<Long> findIdsCitasPopulares(@Param("desde") java.time.LocalDateTime desde, Pageable pageable);

    /**
     * Citas guardadas por un usuario, tal como las ve quien visita su perfil: las públicas y,
     * si alguna la hizo privada su autor, solo la ve ese autor.
     */
    @Query(value = "SELECT a FROM Usuario u JOIN u.citasGuardadas a WHERE u.idusuario = :idusuario " +
            "AND (a.esPublica = true OR a.usuario.idusuario = :idvisitante) ORDER BY a.fecha DESC, a.idanotacion DESC",
            countQuery = "SELECT COUNT(a) FROM Usuario u JOIN u.citasGuardadas a WHERE u.idusuario = :idusuario " +
                    "AND (a.esPublica = true OR a.usuario.idusuario = :idvisitante)")
    org.springframework.data.domain.Page<Anotacion> findCitasGuardadas(@Param("idusuario") Long idusuario,
                                                                       @Param("idvisitante") Long idvisitante, Pageable pageable);

    /** De las citas indicadas, cuáles tiene guardadas el usuario. */
    @Query("SELECT a.idanotacion FROM Usuario u JOIN u.citasGuardadas a WHERE u.idusuario = :idusuario AND a.idanotacion IN :ids")
    List<Long> findIdsGuardadas(@Param("idusuario") Long idusuario, @Param("ids") java.util.Collection<Long> ids);

    /** Cuántas veces se ha guardado cada cita indicada, como filas [idanotacion, cantidad]. */
    @Query("SELECT a.idanotacion, COUNT(u) FROM Usuario u JOIN u.citasGuardadas a WHERE a.idanotacion IN :ids " +
            "GROUP BY a.idanotacion")
    List<Object[]> contarGuardados(@Param("ids") java.util.Collection<Long> ids);

    /** Antes de borrar una anotación hay que quitarla de las citas guardadas de todos. */
    @Modifying
    @Query(value = "DELETE FROM cita_guardada WHERE idanotacion = :idanotacion", nativeQuery = true)
    void borrarDeCitasGuardadas(@Param("idanotacion") Long idanotacion);
}

