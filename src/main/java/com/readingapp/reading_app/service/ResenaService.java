package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.ResenaDTO;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Resena;
import com.readingapp.reading_app.model.Seguimiento;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ResenaService {

    private final ResenaRepository resenaRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;
    private final NotificacionService notificacionService;
    private final SeguimientoRepository seguimientoRepository;
    private final NotificacionRepository notificacionRepository;

    @Transactional
    public ResenaDTO.Response crear(ResenaDTO.CreateRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdusuario())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Libro libro = libroRepository.findById(request.getIdlibro())
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));

        Optional<Seguimiento> ultimo = seguimientoRepository
                .findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(
                        usuario.getIdusuario(), libro.getIdlibro());
        if (ultimo.isEmpty() || ultimo.get().getEstado() != EstadoLectura.LEIDO) {
            throw new IllegalArgumentException("Debes haber terminado el libro antes de escribir una reseña");
        }

        long vecesLeido = seguimientoRepository.countByUsuarioIdusuarioAndLibroIdlibroAndEstado(
                usuario.getIdusuario(), libro.getIdlibro(), EstadoLectura.LEIDO);
        long numResenas = resenaRepository.countByUsuarioIdusuarioAndLibroIdlibro(
                usuario.getIdusuario(), libro.getIdlibro());
        if (numResenas >= vecesLeido) {
            throw new IllegalArgumentException("Ya has reseñado todas tus lecturas de este libro");
        }

        if (request.getPuntuacion() != null) {
            double val = request.getPuntuacion().doubleValue();
            if (val % 0.5 != 0) {
                throw new IllegalArgumentException("La puntuación debe ser en intervalos de 0.5");
            }
        }

        Resena resena = Resena.builder()
                .texto(request.getTexto())
                .puntuacion(request.getPuntuacion())
                .ritmo(request.getRitmo())
                .etiquetas(request.getEtiquetas() != null ? request.getEtiquetas() : new HashSet<>())
                .leidopreviamente(request.getLeidopreviamente() != null ? request.getLeidopreviamente() : false)
                .esPublica(request.getEsPublica() != null ? request.getEsPublica() : true)
                .tieneSpoiler(request.getTieneSpoiler() != null ? request.getTieneSpoiler() : false)
                .fechaCreacion(LocalDateTime.now())
                .usuario(usuario)
                .libro(libro)
                .build();

        resena = resenaRepository.save(resena);

        if (resena.getEsPublica()) {
            for (Usuario seguidor : usuario.getSeguidoresList()) {
                notificacionService.crearNotificacionNuevaResena(resena, seguidor);
            }
        }

        return toResponse(resena);
    }

    public ResenaDTO.Response obtenerPorId(Long id) {
        return toResponse(buscarPorId(id));
    }

    public Page<ResenaDTO.Response> obtenerPorUsuario(Long idusuario, Pageable pageable) {
        return resenaRepository.findByUsuarioIdusuario(idusuario, pageable).map(this::toResponse);
    }

    public Page<ResenaDTO.Response> obtenerPorLibro(Long idlibro, Pageable pageable) {
        return resenaRepository.findByLibroIdlibroAndEsPublicaTrueOrderByLikesDesc(idlibro, pageable)
                .map(this::toResponse);
    }
    public Page<ResenaDTO.Response> obtenerPublicas(Pageable pageable) {
        return resenaRepository.findByEsPublicaTrue(pageable).map(this::toResponse);
    }

    public Page<ResenaDTO.Response> obtenerPublicasPorUsuario(Long idusuario, Pageable pageable) {
        return resenaRepository.findByUsuarioIdusuarioAndEsPublicaTrueOrderByLikesDesc(idusuario, pageable)
                .map(this::toResponse);
    }
    @Transactional
    public ResenaDTO.Response actualizar(Long id, ResenaDTO.UpdateRequest request) {
        Resena resena = buscarPorId(id);
        SecurityUtils.validarUsuario(resena.getUsuario().getIdusuario());
        if (request.getTexto() != null) resena.setTexto(request.getTexto());
        if (request.getPuntuacion() != null) resena.setPuntuacion(request.getPuntuacion());
        if (request.getRitmo() != null) resena.setRitmo(request.getRitmo());
        if (request.getEtiquetas() != null) resena.setEtiquetas(request.getEtiquetas());
        if (request.getEsPublica() != null) resena.setEsPublica(request.getEsPublica());
        if (request.getTieneSpoiler() != null) resena.setTieneSpoiler(request.getTieneSpoiler());
        resena = resenaRepository.save(resena);
        return toResponse(resena);
    }


    @Transactional
    public void eliminar(Long id) {
        Resena resena = buscarPorId(id);
        SecurityUtils.validarUsuarioOAdmin(resena.getUsuario().getIdusuario());
        notificacionRepository.deleteByResenaIdresena(id);
        resena.getLikes().clear();
        resena.getEtiquetas().clear();
        resenaRepository.save(resena);
        resenaRepository.deleteById(id);
    }

    @Transactional
    public void darLike(Long resenaId, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Resena resena = buscarPorId(resenaId);
        usuario.getResenasLikeadas().add(resena);
        usuarioRepository.save(usuario);

        if (!resena.getUsuario().getIdusuario().equals(usuarioId)) {
            notificacionService.crearNotificacionLike(resena, usuario);
        }
    }

    @Transactional
    public void quitarLike(Long resenaId, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Resena resena = buscarPorId(resenaId);
        usuario.getResenasLikeadas().remove(resena);
        usuarioRepository.save(usuario);
    }

    private Resena buscarPorId(Long id) {
        return resenaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reseña no encontrada con id: " + id));
    }

    public List<ResenaDTO.Response> obtenerResenasDeSeguidos(Long idusuario, Pageable pageable) {
        return resenaRepository.findResenasDeSeguidos(idusuario, pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    private ResenaDTO.Response toResponse(Resena resena) {
        return ResenaDTO.Response.builder()
                .idresena(resena.getIdresena())
                .texto(resena.getTexto())
                .puntuacion(resena.getPuntuacion())
                .ritmo(resena.getRitmo())
                .etiquetas(resena.getEtiquetas())
                .leidopreviamente(resena.getLeidopreviamente())
                .esPublica(resena.getEsPublica())
                .tieneSpoiler(resena.getTieneSpoiler())
                .fechaCreacion(resena.getFechaCreacion() != null ? resena.getFechaCreacion().toString() : null)
                .idusuario(resena.getUsuario().getIdusuario())
                .nombreUsuario(resena.getUsuario().getNombre())
                .idlibro(resena.getLibro().getIdlibro())
                .tituloLibro(resena.getLibro().getTitulo())
                .numLikes(resena.getLikes() != null ? resena.getLikes().size() : 0)
                .portadaLibro(resena.getLibro().getPortada())
                .avatarUsuario(resena.getUsuario().getAvatar())
                .build();
    }

    public List<ResenaDTO.Response> obtenerLikesPorUsuario(Long idusuario) {
        return resenaRepository.findResenasLikeadasPorUsuario(idusuario).stream()
                .map(this::toResponse)
                .toList();
    }
}