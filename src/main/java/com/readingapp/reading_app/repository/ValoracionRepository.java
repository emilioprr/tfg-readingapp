package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Valoracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ValoracionRepository extends JpaRepository<Valoracion, Long> {

    Optional<Valoracion> findByUsuarioIdusuarioAndLibroIdlibro(Long idusuario, Long idlibro);

    @Modifying
    @Query("DELETE FROM Valoracion v WHERE v.usuario.idusuario = :idusuario AND v.libro.idlibro = :idlibro")
    void borrar(@Param("idusuario") Long idusuario, @Param("idlibro") Long idlibro);

    @Modifying
    @Query("DELETE FROM Valoracion v WHERE v.libro.idlibro = :idlibro")
    void borrarDeLibro(@Param("idlibro") Long idlibro);

    /** [idlibro, suma de puntuaciones, nº de valoraciones] de todos los libros. */
    @Query("SELECT v.libro.idlibro, SUM(v.puntuacion), COUNT(v) FROM Valoracion v GROUP BY v.libro.idlibro")
    List<Object[]> findSumasPorLibro();

    /** Igual que la anterior pero solo para los libros indicados. */
    @Query("SELECT v.libro.idlibro, SUM(v.puntuacion), COUNT(v) FROM Valoracion v " +
            "WHERE v.libro.idlibro IN :ids GROUP BY v.libro.idlibro")
    List<Object[]> findSumasPorLibros(@Param("ids") Collection<Long> ids);

    @Query("SELECT v.puntuacion, COUNT(v) FROM Valoracion v WHERE v.libro.idlibro = :idlibro GROUP BY v.puntuacion")
    List<Object[]> findDistribucionByLibro(@Param("idlibro") Long idlibro);
}
