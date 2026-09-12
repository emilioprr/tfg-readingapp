package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.RetoDTO;
import com.readingapp.reading_app.model.*;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.model.enums.ModalidadReto;
import com.readingapp.reading_app.model.enums.TipoReto;
import com.readingapp.reading_app.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RetoService {

    private final RetoRepository retoRepository;
    private final ParticipanteRetoRepository participanteRetoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AutorRepository autorRepository;
    private final SeguimientoRepository seguimientoRepository;
    private final SesionLecturaRepository sesionLecturaRepository;
    private final NotificacionService notificacionService;

    public RetoDTO.Response crear(RetoDTO.CreateRequest request) {
        if (request.getModalidad() == ModalidadReto.PREDEFINIDO
                || request.getModalidad() == ModalidadReto.COLABORATIVO) {
            SecurityUtils.validarAdmin();
        }
        Usuario creador = null;

        if (request.getModalidad() == ModalidadReto.PERSONAL
                || request.getModalidad() == ModalidadReto.COMPARTIDO) {
            if (request.getIdCreador() == null) {
                throw new IllegalArgumentException("Los retos personales y compartidos requieren un creador");
            }
            creador = usuarioRepository.findById(request.getIdCreador())
                    .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        } else if (request.getIdCreador() != null) {
            creador = usuarioRepository.findById(request.getIdCreador()).orElse(null);
        }

        LocalDate fechaInicio = LocalDate.now();

        if (request.getFechaFin().isBefore(fechaInicio)) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a hoy");
        }

        Reto reto = Reto.builder()
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .tipo(request.getTipo())
                .modalidad(request.getModalidad())
                .meta(request.getMeta())
                .fechaInicio(fechaInicio)
                .fechaFin(request.getFechaFin())
                .creador(creador)
                .build();

        reto = retoRepository.save(reto);

        if (request.getModalidad() == ModalidadReto.PERSONAL && creador != null) {
            ParticipanteReto participante = ParticipanteReto.builder()
                    .reto(reto)
                    .usuario(creador)
                    .progreso(0)
                    .retoCumplido(false)
                    .fechaUnion(LocalDateTime.now())
                    .build();
            participanteRetoRepository.save(participante);
        }

        return toResponse(reto);
    }

    @Transactional
    public RetoDTO.ParticipanteResponse unirse(Long idreto, Long idusuario) {
        Reto reto = buscarPorId(idreto);

        if (reto.getModalidad() == ModalidadReto.PERSONAL) {
            throw new IllegalArgumentException("No puedes unirte a un reto personal de otro usuario");
        }

        if (participanteRetoRepository.existsByRetoIdretoAndUsuarioIdusuario(idreto, idusuario)) {
            throw new IllegalArgumentException("Ya participas en este reto");
        }

        Usuario usuario = usuarioRepository.findById(idusuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        ParticipanteReto participante = ParticipanteReto.builder()
                .reto(reto)
                .usuario(usuario)
                .progreso(0)
                .retoCumplido(false)
                .fechaUnion(LocalDateTime.now())
                .build();

        participante = participanteRetoRepository.save(participante);
        return toParticipanteResponse(participante, reto.getMeta());
    }

    public RetoDTO.Response obtenerPorId(Long id) {
        return toResponse(buscarPorId(id));
    }

    public Page<RetoDTO.Response> obtenerPorModalidad(ModalidadReto modalidad, Pageable pageable) {
        return retoRepository.findByModalidad(modalidad, pageable).map(this::toResponse);
    }

    public Page<RetoDTO.Response> obtenerDisponibles(Pageable pageable) {
        // Todos los que puedes unirte: predefinidos + compartidos + colaborativos
        List<ModalidadReto> modalidades = List.of(
                ModalidadReto.PREDEFINIDO, ModalidadReto.COMPARTIDO, ModalidadReto.COLABORATIVO);
        return retoRepository.findByModalidadIn(modalidades, pageable).map(this::toResponse);
    }

    public Page<RetoDTO.Response> obtenerCreadosPorUsuario(Long idusuario, Pageable pageable) {
        return retoRepository.findByCreadorIdusuario(idusuario, pageable).map(this::toResponse);
    }

    public Page<RetoDTO.ParticipanteResponse> obtenerRetosActivos(Long idusuario, Pageable pageable) {
        return participanteRetoRepository.findByUsuarioIdusuarioAndRetoCumplidoFalse(idusuario, pageable)
                .map(p -> toParticipanteResponse(p, p.getReto().getMeta()));
    }

    public Page<RetoDTO.LogroResponse> obtenerLogros(Long idusuario, Pageable pageable) {
        return participanteRetoRepository.findByUsuarioIdusuarioAndRetoCumplidoTrue(idusuario, pageable)
                .map(this::toLogroResponse);
    }

    @Transactional
    public RetoDTO.ParticipanteResponse recalcularProgreso(Long idreto, Long idusuario) {
        Reto reto = buscarPorId(idreto);
        ParticipanteReto participante = participanteRetoRepository
                .findByRetoIdretoAndUsuarioIdusuario(idreto, idusuario)
                .orElseThrow(() -> new EntityNotFoundException("No participas en este reto"));

        if (participante.getRetoCumplido()) {
            return toParticipanteResponse(participante, reto.getMeta());
        }

        // Calcular progreso individual
        int nuevoProgreso = calcularProgreso(reto, idusuario);
        participante.setProgreso(nuevoProgreso);
        participante = participanteRetoRepository.save(participante);

        if (reto.getModalidad() == ModalidadReto.COLABORATIVO) {
            int progresoTotal = participanteRetoRepository.sumProgresoByReto(idreto);
            int metaReal = reto.getTipo().name().equals("HORAS") ? reto.getMeta() * 60 : reto.getMeta();
            if (progresoTotal >= metaReal) {
                completarRetoColaborativo(reto);
            }
        } else {
            int metaReal = reto.getTipo().name().equals("HORAS") ? reto.getMeta() * 60 : reto.getMeta();
            if (nuevoProgreso >= metaReal) {
                completarParticipante(participante, reto);
            }
        }

        return toParticipanteResponse(participante, reto.getMeta());
    }

    /*Recalcula todos los retos activos de un usuario. Llamar desde SeguimientoService y SesionLecturaService*/
    @Transactional
    public void recalcularRetosActivosDeUsuario(Long idusuario) {
        List<ParticipanteReto> activos = participanteRetoRepository
                .findByUsuarioIdusuarioAndRetoCumplidoFalse(idusuario);

        log.info("Recalculando retos para usuario {}: {} retos activos", idusuario, activos.size());

        for (ParticipanteReto p : activos) {
            int progreso = calcularProgreso(p.getReto(), idusuario);
            log.info("Reto {}: progreso calculado = {}", p.getReto().getIdreto(), progreso);
            recalcularProgreso(p.getReto().getIdreto(), idusuario);
        }
    }

    @Transactional
    public void abandonar(Long idreto, Long idusuario) {
        ParticipanteReto participante = participanteRetoRepository
                .findByRetoIdretoAndUsuarioIdusuario(idreto, idusuario)
                .orElseThrow(() -> new EntityNotFoundException("No participas en este reto"));

        Reto reto = participante.getReto();
        if (reto.getModalidad() == ModalidadReto.PERSONAL) {
            throw new IllegalArgumentException("No puedes abandonar un reto personal, elimínalo");
        }

        participanteRetoRepository.delete(participante);
    }

    @Transactional
    public void eliminar(Long idreto, Long idusuario) {
        Reto reto = buscarPorId(idreto);
        boolean esCreador = reto.getCreador() != null
                && reto.getCreador().getIdusuario().equals(idusuario);
        boolean esSistema = reto.getCreador() == null;

        if (!esCreador && !esSistema) {
            throw new IllegalArgumentException("Solo el creador puede eliminar el reto");
        }
        retoRepository.delete(reto);
    }

    // --- Completar retos ---

    private void completarParticipante(ParticipanteReto participante, Reto reto) {
        participante.setRetoCumplido(true);
        participante.setFechaCumplimiento(LocalDateTime.now());
        participanteRetoRepository.save(participante);

        Usuario usuario = participante.getUsuario();

        // Notificar al propio usuario
        notificacionService.crearNotificacionRetoCumplido(reto, usuario, usuario);

        // Notificar a seguidores
        for (Usuario seguidor : usuario.getSeguidoresList()) {
            notificacionService.crearNotificacionRetoCumplido(reto, usuario, seguidor);
        }

        log.info("Usuario {} completó el reto '{}'", usuario.getIdusuario(), reto.getTitulo());
    }

    private void completarRetoColaborativo(Reto reto) {
        List<ParticipanteReto> activos = participanteRetoRepository.findActivosByReto(reto.getIdreto());

        for (ParticipanteReto p : activos) {
            p.setRetoCumplido(true);
            p.setFechaCumplimiento(LocalDateTime.now());
            participanteRetoRepository.save(p);

            // Notificar a seguidores de cada participante
            for (Usuario seguidor : p.getUsuario().getSeguidoresList()) {
                notificacionService.crearNotificacionRetoCumplido(reto, p.getUsuario(), seguidor);
            }
        }

        log.info("Reto colaborativo '{}' completado por {} participantes", reto.getTitulo(), activos.size());
    }

    // --- Cálculo de progreso ---

    private int calcularProgreso(Reto reto, Long idusuario) {
        LocalDate inicio = reto.getFechaInicio();
        LocalDate fin = reto.getFechaFin();

        return switch (reto.getTipo()) {
            case PAGINAS -> seguimientoRepository.sumPaginasByUsuarioEntreFechas(idusuario, inicio, fin).intValue();
            case HORAS -> sesionLecturaRepository.sumMinutosByUsuarioEntreFechas(
                    idusuario,
                    inicio.atStartOfDay(),
                    fin.plusDays(1).atStartOfDay()
            );
            case LIBROS -> seguimientoRepository
                    .countByUsuarioIdusuarioAndEstadoAndFechaBetween(idusuario, EstadoLectura.LEIDO, inicio, fin).intValue();
            case LIBROS_AUTOR -> seguimientoRepository
                    .countByUsuarioIdusuarioAndLibroAutorIdautorAndEstadoAndFechaBetween(
                            idusuario, reto.getAutor().getIdautor(), EstadoLectura.LEIDO, inicio, fin).intValue();
        };
    }

    // --- Helpers ---

    private Reto buscarPorId(Long id) {
        return retoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reto no encontrado con id: " + id));
    }

    private RetoDTO.Response toResponse(Reto reto) {
        List<RetoDTO.ParticipanteResponse> participantes = reto.getParticipantes().stream()
                .map(p -> toParticipanteResponse(p, reto.getMeta()))
                .collect(Collectors.toList());

        Integer progresoColab = null;
        Double porcentajeColab = null;
        if (reto.getModalidad() == ModalidadReto.COLABORATIVO) {
            progresoColab = participanteRetoRepository.sumProgresoByReto(reto.getIdreto());
            porcentajeColab = reto.getMeta() > 0
                    ? Math.round(progresoColab * 1000.0 / reto.getMeta()) / 10.0 : 0.0;
        }

        return RetoDTO.Response.builder()
                .idreto(reto.getIdreto())
                .titulo(reto.getTitulo())
                .descripcion(reto.getDescripcion())
                .tipo(reto.getTipo())
                .modalidad(reto.getModalidad())
                .meta(reto.getMeta())
                .fechaInicio(reto.getFechaInicio().toString())
                .fechaFin(reto.getFechaFin().toString())
                .idCreador(reto.getCreador() != null ? reto.getCreador().getIdusuario() : null)
                .nombreCreador(reto.getCreador() != null ? reto.getCreador().getNombre() : "ReadingApp")
                .idAutor(reto.getAutor() != null ? reto.getAutor().getIdautor() : null)
                .nombreAutor(reto.getAutor() != null ? reto.getAutor().getNombre() : null)
                .numParticipantes(reto.getParticipantes().size())
                .progresoColaborativo(progresoColab)
                .porcentajeColaborativo(porcentajeColab)
                .participantes(participantes)
                .build();
    }

    private RetoDTO.ParticipanteResponse toParticipanteResponse(ParticipanteReto p, Integer meta) {
        Reto reto = p.getReto();
        int metaReal = reto.getTipo().name().equals("HORAS") ? meta * 60 : meta;
        double porcentaje = metaReal > 0 ? Math.min(100.0, (p.getProgreso() * 100.0) / metaReal) : 0;
        return RetoDTO.ParticipanteResponse.builder()
                .idparticipante(p.getIdparticipante())
                .idreto(reto.getIdreto())
                .tituloReto(reto.getTitulo())
                .tipoReto(reto.getTipo())
                .modalidadReto(reto.getModalidad())
                .meta(metaReal)
                .idusuario(p.getUsuario().getIdusuario())
                .nombreUsuario(p.getUsuario().getNombre())
                .progreso(p.getProgreso())
                .retoCumplido(p.getRetoCumplido())
                .fechaUnion(p.getFechaUnion().toString())
                .fechaCumplimiento(p.getFechaCumplimiento() != null ? p.getFechaCumplimiento().toString() : null)
                .porcentaje(Math.round(porcentaje * 10.0) / 10.0)
                .build();
    }

    private RetoDTO.LogroResponse toLogroResponse(ParticipanteReto p) {
        Reto reto = p.getReto();
        return RetoDTO.LogroResponse.builder()
                .idreto(reto.getIdreto())
                .tituloReto(reto.getTitulo())
                .tipo(reto.getTipo())
                .modalidad(reto.getModalidad())
                .meta(reto.getMeta())
                .fechaCumplimiento(p.getFechaCumplimiento() != null ? p.getFechaCumplimiento().toString() : null)
                .nombreAutor(reto.getAutor() != null ? reto.getAutor().getNombre() : null)
                .build();
    }
}

