package com.readingapp.reading_app.service;

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

    @Transactional
    public RetoDTO.Response crear(RetoDTO.CreateRequest request) {
        Usuario creador = null;

        // PERSONAL y COMPARTIDO requieren creador
        if (request.getModalidad() == ModalidadReto.PERSONAL
                || request.getModalidad() == ModalidadReto.COMPARTIDO) {
            if (request.getIdCreador() == null) {
                throw new IllegalArgumentException("Los retos personales y compartidos requieren un creador");
            }
            creador = usuarioRepository.findById(request.getIdCreador())
                    .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        } else if (request.getIdCreador() != null) {
            // PREDEFINIDO/COLABORATIVO pueden tener creador opcional (admin)
            creador = usuarioRepository.findById(request.getIdCreador()).orElse(null);
        }

        if (request.getFechaFin().isBefore(request.getFechaInicio())) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la de inicio");
        }

        Reto reto = Reto.builder()
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .tipo(request.getTipo())
                .modalidad(request.getModalidad())
                .meta(request.getMeta())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .creador(creador)
                .build();

        if (request.getTipo() == TipoReto.LIBROS_AUTOR) {
            if (request.getIdAutor() == null) {
                throw new IllegalArgumentException("El reto LIBROS_AUTOR requiere un autor");
            }
            Autor autor = autorRepository.findById(request.getIdAutor())
                    .orElseThrow(() -> new EntityNotFoundException("Autor no encontrado"));
            reto.setAutor(autor);
        }

        reto = retoRepository.save(reto);

        // En PERSONAL, el creador se une automáticamente
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
            // Comprobar progreso colectivo
            int progresoTotal = participanteRetoRepository.sumProgresoByReto(idreto);
            if (progresoTotal >= reto.getMeta()) {
                completarRetoColaborativo(reto);
            }
        } else {
            // Individual: comprobar solo este participante
            if (nuevoProgreso >= reto.getMeta()) {
                completarParticipante(participante, reto);
            }
        }

        return toParticipanteResponse(participante, reto.getMeta());
    }

    /**
     * Recalcula todos los retos activos de un usuario.
     * Llamar desde SeguimientoService y SesionLecturaService.
     */
    @Transactional
    public void recalcularRetosActivosDeUsuario(Long idusuario) {
        List<ParticipanteReto> activos = participanteRetoRepository
                .findByUsuarioIdusuarioAndRetoCumplidoFalse(idusuario);

        for (ParticipanteReto p : activos) {
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

        // Notificar a seguidores
        Usuario usuario = participante.getUsuario();
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
        return switch (reto.getTipo()) {
            case PAGINAS -> seguimientoRepository.sumPaginasByUsuario(idusuario);
            case HORAS -> sesionLecturaRepository.sumMinutosByUsuario(idusuario) / 60;
            case LIBROS -> seguimientoRepository
                    .countByUsuarioIdusuarioAndEstado(idusuario, EstadoLectura.LEIDO).intValue();
            case LIBROS_AUTOR -> seguimientoRepository
                    .countByUsuarioIdusuarioAndLibroAutorIdautorAndEstado(
                            idusuario, reto.getAutor().getIdautor(), EstadoLectura.LEIDO).intValue();
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
        double porcentaje = meta > 0 ? Math.min(100.0, (p.getProgreso() * 100.0) / meta) : 0;
        return RetoDTO.ParticipanteResponse.builder()
                .idparticipante(p.getIdparticipante())
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

