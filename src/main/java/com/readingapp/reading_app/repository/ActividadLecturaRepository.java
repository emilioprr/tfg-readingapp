package com.readingapp.reading_app.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Repository
public class ActividadLecturaRepository {

    public static final int MIN_MINUTOS_SESION = 5;

    @PersistenceContext
    private EntityManager entityManager;

    /** Días con actividad: avance de páginas, libro terminado o sesión de 5+ minutos. */
    public Set<LocalDate> diasConActividad(Long idusuario, LocalDate desde) {
        Set<LocalDate> dias = new HashSet<>();

        List<?> progreso = entityManager.createNativeQuery(
                        "SELECT DISTINCT fecha FROM seguimiento WHERE idusuario = ?1 AND fecha >= ?2 " +
                                "AND ((estado = 'LEYENDO' AND num_pagina > 0) OR estado = 'LEIDO')")
                .setParameter(1, idusuario)
                .setParameter(2, desde)
                .getResultList();
        progreso.stream().filter(Objects::nonNull).forEach(o -> dias.add(aLocalDate(o)));

        List<?> sesiones = entityManager.createNativeQuery(
                        "SELECT DISTINCT CAST(inicio AS DATE) FROM sesion_lectura " +
                                "WHERE id_usuario = ?1 AND duracion_minutos >= ?2 AND inicio >= ?3")
                .setParameter(1, idusuario)
                .setParameter(2, MIN_MINUTOS_SESION)
                .setParameter(3, desde.atStartOfDay())
                .getResultList();
        sesiones.stream().filter(Objects::nonNull).forEach(o -> dias.add(aLocalDate(o)));

        return dias;
    }

    private LocalDate aLocalDate(Object o) {
        if (o instanceof LocalDate ld) return ld;
        if (o instanceof java.sql.Date d) return d.toLocalDate();
        if (o instanceof java.sql.Timestamp t) return t.toLocalDateTime().toLocalDate();
        if (o instanceof LocalDateTime ldt) return ldt.toLocalDate();
        return LocalDate.parse(o.toString().substring(0, 10));
    }
}