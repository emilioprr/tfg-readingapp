package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.ParticipanteReto;
import com.readingapp.reading_app.model.enums.ModalidadReto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ParticipanteRetoRepository extends JpaRepository<ParticipanteReto, Long> {

    Optional<ParticipanteReto> findByRetoIdretoAndUsuarioIdusuario(Long idreto, Long idusuario);

    boolean existsByRetoIdretoAndUsuarioIdusuario(Long idreto, Long idusuario);

    List<ParticipanteReto> findByUsuarioIdusuarioAndRetoCumplidoFalse(Long idusuario);

    Page<ParticipanteReto> findByUsuarioIdusuarioAndRetoCumplidoTrue(Long idusuario, Pageable pageable);

    List<ParticipanteReto> findByRetoIdreto(Long idreto);

    // Para retos activos de un usuario (paginado)
    Page<ParticipanteReto> findByUsuarioIdusuarioAndRetoCumplidoFalse(Long idusuario, Pageable pageable);

    // Suma de progreso de todos los participantes de un reto (para COLABORATIVO)
    @Query("SELECT COALESCE(SUM(p.progreso), 0) FROM ParticipanteReto p WHERE p.reto.idreto = :idreto")
    Integer sumProgresoByReto(@Param("idreto") Long idreto);

    // Todos los participantes de un reto por modalidad
    @Query("SELECT p FROM ParticipanteReto p WHERE p.reto.idreto = :idreto AND p.retoCumplido = false")
    List<ParticipanteReto> findActivosByReto(@Param("idreto") Long idreto);
}

