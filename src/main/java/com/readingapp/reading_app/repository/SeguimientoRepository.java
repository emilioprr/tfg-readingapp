package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Seguimiento;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SeguimientoRepository extends JpaRepository<Seguimiento, Long> {
    List<Seguimiento> findByUsuarioIdusuario(Long idusuario);
    List<Seguimiento> findByUsuarioIdusuarioAndLibroIdlibro(Long idusuario, Long idlibro);
    List<Seguimiento> findByUsuarioIdusuarioAndEstado(Long idusuario, EstadoLectura estado);
    Optional<Seguimiento> findTopByUsuarioIdusuarioAndLibroIdlibroOrderByFechaDesc(Long idusuario, Long idlibro);
}
