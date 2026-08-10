package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Recomendacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecomendacionRepository extends JpaRepository<Recomendacion, Long> {
    List<Recomendacion> findByReceptorIdusuario(Long idusuario);
    List<Recomendacion> findByEmisorIdusuario(Long idusuario);
    List<Recomendacion> findByReceptorIdusuarioAndVistoFalse(Long idusuario);
    List<Recomendacion> findByReceptorIdusuarioAndEsAutomaticaTrue(Long idusuario);
}
