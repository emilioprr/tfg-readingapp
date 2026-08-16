package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Anotacion;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnotacionRepository extends JpaRepository<Anotacion, Long> {
    List<Anotacion> findByUsuarioIdusuario(Long idusuario, Pageable pageable);
    List<Anotacion> findByLibroIdlibro(Long idlibro, Pageable pageable);
    List<Anotacion> findByUsuarioIdusuarioAndLibroIdlibro(Long idusuario, Long idlibro);
    List<Anotacion> findByUsuarioIdusuarioAndTipo(Long idusuario, TipoAnotacion tipo, Pageable pageable);
}

