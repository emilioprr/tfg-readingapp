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
    @Query("SELECT COALESCE(SUM(s.numPagina), 0) FROM Seguimiento s WHERE s.usuario.idusuario = :uid")
    Integer sumPaginasByUsuario(@Param("uid") Long uid);
    Long countByUsuarioIdusuarioAndEstado(Long idusuario, EstadoLectura estado);
    @Query("SELECT COUNT(s) FROM Seguimiento s WHERE s.usuario.idusuario = :uid AND s.libro.autor.idautor = :aid AND s.estado = :estado")
    Long countByUsuarioIdusuarioAndLibroAutorIdautorAndEstado(@Param("uid") Long uid, @Param("aid") Long aid, @Param("estado") EstadoLectura estado);
}
