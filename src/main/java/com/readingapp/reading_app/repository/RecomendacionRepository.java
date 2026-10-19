package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Recomendacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecomendacionRepository extends JpaRepository<Recomendacion, Long> {
    List<Recomendacion> findByReceptorIdusuario(Long idusuario);
    List<Recomendacion> findByEmisorIdusuario(Long idusuario);
    /** Las creadas antes de que "visto" tuviera valor por defecto lo guardan a NULL: también cuentan como no vistas. */
    @Query("SELECT r FROM Recomendacion r WHERE r.receptor.idusuario = :idusuario AND (r.visto = false OR r.visto IS NULL)")
    List<Recomendacion> findNoVistasByReceptor(@Param("idusuario") Long idusuario);
}
