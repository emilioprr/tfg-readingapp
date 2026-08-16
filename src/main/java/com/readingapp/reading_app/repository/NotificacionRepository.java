package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Notificacion;
import com.readingapp.reading_app.model.enums.TipoNotificacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    Page<Notificacion> findByUsuarioIdusuarioOrderByFechaDesc(Long idusuario, Pageable pageable);
    Page<Notificacion> findByUsuarioIdusuarioAndLeidaFalseOrderByFechaDesc(Long idusuario, Pageable pageable);
    List<Notificacion> findByUsuarioIdusuarioAndLeidaFalseOrderByFechaDesc(Long idusuario);
    Page<Notificacion> findByUsuarioIdusuarioAndTipoOrderByFechaDesc(Long idusuario, TipoNotificacion tipo, Pageable pageable);
    long countByUsuarioIdusuarioAndLeidaFalse(Long idusuario);
}
