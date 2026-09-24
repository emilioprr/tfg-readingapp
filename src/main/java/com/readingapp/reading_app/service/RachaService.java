package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.RachaDTO;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RachaService {

    private static final int MIN_MINUTOS_SESION = 5;
    private static final int MAX_PROTECTORES = 2;
    private static final int DIAS_POR_PROTECTOR = 7;
    private static final List<Integer> HITOS = List.of(7, 30, 100, 365);
    private static final String[] LETRAS = {"L", "M", "X", "J", "V", "S", "D"};

    private final UsuarioRepository usuarioRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public RachaDTO.Response calcular(Long idusuario) {
        Usuario usuario = usuarioRepository.findById(idusuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        LocalDate hoy = LocalDate.now();
        LocalDate ayer = hoy.minusDays(1);

        Set<LocalDate> actividad = obtenerDiasConActividad(idusuario, hoy.minusDays(400));
        Set<LocalDate> protegidos = usuario.getDiasProtegidos();
        int protectores = valor(usuario.getProtectoresRacha());

        // 1. Si hay días perdidos entre la última actividad y ayer, cubrirlos con protectores
        Set<LocalDate> cubiertos = new HashSet<>(actividad);
        cubiertos.addAll(protegidos);
        LocalDate ultimo = cubiertos.stream().filter(d -> d.isBefore(hoy)).max(LocalDate::compareTo).orElse(null);

        if (ultimo != null && ultimo.isBefore(ayer)) {
            long huecos = ChronoUnit.DAYS.between(ultimo, ayer);
            if (huecos <= protectores) {
                for (LocalDate d = ultimo.plusDays(1); !d.isAfter(ayer); d = d.plusDays(1)) {
                    protegidos.add(d);
                    cubiertos.add(d);
                }
                protectores -= (int) huecos;
            }
        }

        // 2. Contar días seguidos (desde hoy si ya leyó, si no desde ayer)
        boolean hoyCompletado = actividad.contains(hoy);
        LocalDate cursor = hoyCompletado ? hoy : ayer;
        int racha = 0;
        while (cubiertos.contains(cursor)) {
            racha++;
            cursor = cursor.minusDays(1);
        }

        // 3. Premiar con un protector cada 7 días de racha (máximo 2 acumulados)
        boolean nuevoProtector = false;
        if (hoyCompletado && racha > 0 && racha % DIAS_POR_PROTECTOR == 0
                && !hoy.equals(usuario.getFechaUltimoProtector()) && protectores < MAX_PROTECTORES) {
            protectores++;
            usuario.setFechaUltimoProtector(hoy);
            nuevoProtector = true;
        }

        // 4. Récord y guardado
        int mejor = Math.max(valor(usuario.getMejorRacha()), racha);
        usuario.setMejorRacha(mejor);
        usuario.setProtectoresRacha(protectores);
        usuarioRepository.save(usuario);

        // 5. Semana actual (lunes a domingo)
        LocalDate lunes = hoy.with(DayOfWeek.MONDAY);
        List<RachaDTO.DiaSemana> semana = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = lunes.plusDays(i);
            String estado;
            if (d.isAfter(hoy)) estado = "FUTURO";
            else if (actividad.contains(d)) estado = "LEIDO";
            else if (protegidos.contains(d)) estado = "PROTEGIDO";
            else if (d.equals(hoy)) estado = "PENDIENTE";
            else estado = "VACIO";

            semana.add(RachaDTO.DiaSemana.builder()
                    .fecha(d.toString()).letra(LETRAS[i]).estado(estado).esHoy(d.equals(hoy)).build());
        }

        return RachaDTO.Response.builder()
                .racha(racha)
                .hoyCompletado(hoyCompletado)
                .mejorRacha(mejor)
                .protectores(protectores)
                .nuevoProtector(nuevoProtector)
                .insignias(HITOS.stream().filter(h -> mejor >= h).toList())
                .semana(semana)
                .build();
    }

    /** Un día cuenta si hubo avance de páginas, libro terminado o sesión de 5+ minutos. */
    private Set<LocalDate> obtenerDiasConActividad(Long idusuario, LocalDate desde) {
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

    private int valor(Integer n) {
        return n == null ? 0 : n;
    }
}