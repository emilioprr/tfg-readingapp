package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.RachaDTO;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.ActividadLecturaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RachaService {

    public static final int MAX_PROTECTORES = 2;
    public static final int DIAS_POR_PROTECTOR = 7;
    public static final List<Integer> HITOS = List.of(7, 30, 100, 365);
    private static final String[] LETRAS = {"L", "M", "X", "J", "V", "S", "D"};

    private final UsuarioRepository usuarioRepository;
    private final ActividadLecturaRepository actividadLecturaRepository;
    private final Clock clock;

    @Transactional
    public RachaDTO.Response calcular(Long idusuario) {
        Usuario usuario = usuarioRepository.findById(idusuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        LocalDate hoy = LocalDate.now(clock);
        LocalDate ayer = hoy.minusDays(1);

        Set<LocalDate> actividad = actividadLecturaRepository.diasConActividad(idusuario, hoy.minusDays(400));
        Set<LocalDate> protegidos = usuario.getDiasProtegidos();
        int protectores = valor(usuario.getProtectoresRacha());

        // 1. Cubrir días perdidos con protectores
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

        // 2. Contar días seguidos
        boolean hoyCompletado = actividad.contains(hoy);
        LocalDate cursor = hoyCompletado ? hoy : ayer;
        int racha = 0;
        while (cubiertos.contains(cursor)) {
            racha++;
            cursor = cursor.minusDays(1);
        }

        // 3. Premiar protector cada 7 días (máx. 2)
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

        // 5. Semana actual
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

    private int valor(Integer n) {
        return n == null ? 0 : n;
    }
}