package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Reto;
import com.readingapp.reading_app.model.enums.ModalidadReto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RetoRepository extends JpaRepository<Reto, Long> {

    Page<Reto> findByModalidad(ModalidadReto modalidad, Pageable pageable);

    List<Reto> findByModalidad(ModalidadReto modalidad);

    Page<Reto> findByCreadorIdusuario(Long idusuario, Pageable pageable);

    // Retos a los que te puedes unir: predefinidos + compartidos + colaborativos
    Page<Reto> findByModalidadIn(List<ModalidadReto> modalidades, Pageable pageable);
}

