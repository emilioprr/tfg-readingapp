package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Reto;
import com.readingapp.reading_app.model.enums.ModalidadReto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RetoRepository extends JpaRepository<Reto, Long> {

    // Solo retos vigentes: los que ya han terminado dejan de mostrarse
    Page<Reto> findByModalidadAndFechaFinGreaterThanEqual(ModalidadReto modalidad, LocalDate hoy, Pageable pageable);

    Page<Reto> findByCreadorIdusuarioAndFechaFinGreaterThanEqual(Long idusuario, LocalDate hoy, Pageable pageable);

    // Retos a los que te puedes unir: predefinidos + compartidos + colaborativos
    Page<Reto> findByModalidadInAndFechaFinGreaterThanEqual(List<ModalidadReto> modalidades, LocalDate hoy, Pageable pageable);
}

