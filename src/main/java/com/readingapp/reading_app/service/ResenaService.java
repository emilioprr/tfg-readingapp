package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.ResenaDTO;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Resena;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class ResenaService {

    private final ResenaRepository resenaRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;
    private final NotificacionService notificacionService;

    @Transactional
    public ResenaDTO.Response crear(ResenaDTO.CreateRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdusuario())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Libro libro = libroRepository.findById(request.getIdlibro())
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));

        resenaRepository.findByUsuarioIdusuarioAndLibroIdlibro(request.getIdusuario(), request.getIdlibro())
                .ifPresent(r -> { throw new IllegalArgumentException("Ya existe una reseña de este usuario para este libro"); });

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
        return resenaRepository.findByLibroIdlibro(idlibro, pageable).map(this::toResponse);
    }

    public Page<ResenaDTO.Response> obtenerPublicas(Pageable pageable) {
        return resenaRepository.findByEsPublicaTrue(pageable).map(this::toResponse);
    }

    @Transactional
    public ResenaDTO.Response actualizar(Long id, ResenaDTO.UpdateRequest request) {
        Resena resena = buscarPorId(id);
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
        if (!resenaRepository.existsById(id)) throw new EntityNotFoundException("Reseña no encontrada");
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
                .build();
    }
}