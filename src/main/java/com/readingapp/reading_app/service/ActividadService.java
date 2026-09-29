package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.ActividadDTO;
import com.readingapp.reading_app.dto.ActividadDTO.Tipo;
import com.readingapp.reading_app.model.*;
import com.readingapp.reading_app.repository.ParticipanteRetoRepository;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Feed de actividad de las personas que sigue un usuario: qué empiezan a leer, qué terminan,
 * qué quieren leer, sus reseñas públicas y los retos que consiguen, de lo más reciente a lo más antiguo.
 *
 * Mezcla tres fuentes, así que para la página N se piden a cada una los (N+1)·tamaño primeros eventos,
 * se ordenan juntos y se recorta la página: el resultado es exacto aunque una fuente domine.
 */
@Service
@RequiredArgsConstructor
public class ActividadService {

    // Sin límite de fechas: la paginación decide cuánto se ve
    private static final LocalDate DESDE_SIEMPRE = LocalDate.of(1970, 1, 1);

    private final SeguimientoRepository seguimientoRepository;
    private final ResenaRepository resenaRepository;
    private final ParticipanteRetoRepository participanteRetoRepository;

    /** Evento con su instante para poder ordenar fuentes distintas en un único feed. */
    private record Evento(LocalDateTime cuando, ActividadDTO.Response datos) {}

    @Transactional(readOnly = true)
    public ActividadDTO.Pagina obtenerDeSeguidos(Long idusuario, int pagina, int tamanio) {
        LocalDate desde = DESDE_SIEMPRE;
        int hasta = (pagina + 1) * tamanio;
        PageRequest primeros = PageRequest.of(0, hasta + 1); // +1 para saber si hay más
        List<Evento> eventos = new ArrayList<>();

        for (Seguimiento s : seguimientoRepository.findActividadDeSeguidos(idusuario, desde, primeros)) {
            Tipo tipo = switch (s.getEstado()) {
                case LEIDO -> Tipo.TERMINO;
                case PENDIENTE -> Tipo.QUIERE_LEER;
                default -> Tipo.EMPEZO;
            };
            // Los seguimientos solo guardan el día: se sitúan al principio, así una reseña de ese mismo día
            // (que se escribe después de terminar el libro) aparece por encima
            eventos.add(new Evento(s.getFecha().atStartOfDay(), conLibro(tipo, s.getUsuario(), s.getLibro())
                    .fecha(s.getFecha().toString()).build()));
        }

        for (Resena r : resenaRepository.findResenasDeSeguidos(idusuario, primeros)) {
            if (r.getFechaCreacion() == null || r.getFechaCreacion().toLocalDate().isBefore(desde)) continue;
            eventos.add(new Evento(r.getFechaCreacion(), conLibro(Tipo.RESENA, r.getUsuario(), r.getLibro())
                    .idresena(r.getIdresena()).puntuacion(r.getPuntuacion())
                    .fecha(r.getFechaCreacion().toString()).build()));
        }

        for (ParticipanteReto p : participanteRetoRepository.findRetosCumplidosDeSeguidos(idusuario, desde.atStartOfDay(), primeros)) {
            eventos.add(new Evento(p.getFechaCumplimiento(), ActividadDTO.Response.builder()
                    .tipo(Tipo.RETO_CONSEGUIDO)
                    .idusuario(p.getUsuario().getIdusuario())
                    .nombreUsuario(p.getUsuario().getNombre())
                    .avatarUsuario(p.getUsuario().getAvatar())
                    .idreto(p.getReto().getIdreto())
                    .tituloReto(p.getReto().getTitulo())
                    .fecha(p.getFechaCumplimiento().toString())
                    .build()));
        }

        List<ActividadDTO.Response> ordenados = eventos.stream()
                .sorted(Comparator.comparing(Evento::cuando).reversed())
                .map(Evento::datos)
                .toList();
        int desdeIndice = Math.min(pagina * tamanio, ordenados.size());
        return ActividadDTO.Pagina.builder()
                .eventos(ordenados.subList(desdeIndice, Math.min(hasta, ordenados.size())))
                .pagina(pagina)
                .hayMas(ordenados.size() > hasta)
                .build();
    }

    private static ActividadDTO.Response.ResponseBuilder conLibro(Tipo tipo, Usuario usuario, Libro libro) {
        return ActividadDTO.Response.builder()
                .tipo(tipo)
                .idusuario(usuario.getIdusuario())
                .nombreUsuario(usuario.getNombre())
                .avatarUsuario(usuario.getAvatar())
                .idlibro(libro.getIdlibro())
                .tituloLibro(libro.getTitulo())
                .portadaLibro(libro.getPortada())
                .nombreAutor(libro.getAutor() != null ? libro.getAutor().getNombre() : null);
    }
}
