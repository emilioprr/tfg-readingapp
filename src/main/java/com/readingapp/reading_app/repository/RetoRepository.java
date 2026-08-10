package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Reto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RetoRepository extends JpaRepository<Reto, Long> {
    List<Reto> findByUsuarioIdusuario(Long idusuario);
    Optional<Reto> findByUsuarioIdusuarioAndFechafinIsNull(Long idusuario);
}
