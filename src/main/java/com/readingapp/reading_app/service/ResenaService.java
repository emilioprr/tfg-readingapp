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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResenaService {

    private final ResenaRepository resenaRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;

    @Transactional
    public ResenaDTO.Response crear(ResenaDTO.CreateRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdusuario())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Libro libro = libroRepository.findById(request.getIdlibro())
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));

        // Verificar que no exista ya una reseña de este usuario para este libro
        resenaRepository.findByUsuarioIdusuarioAndLibroIdlibro(request.getIdusuario(), request.getIdlibro())
                .ifPresent(r -> { throw new IllegalArgumentException("Ya existe una reseña de este usuario para este libro"); });

        Resena resena = Resena.builder()
                .texto(request.getTexto())
                .puntuacion(request.getPuntuacion())
                .puntestilo(request.getPuntestilo())
                .puntritmo(request.getPuntritmo())
                .puntpersonajes(request.getPuntpersonajes())
                .leidopreviamente(request.getLeidopreviamente() != null ? request.getLeidopreviamente() : false)
                .esPublica(request.getEsPublica() != null ? request.getEsPublica() : true)
                .tieneSpoiler(request.getTieneSpoiler() != null ? request.getTieneSpoiler() : false)
                .usuario(usuario)
                .libro(libro)
                .build();

        resena = resenaRepository.save(resena);
        return toResponse(resena);
    }

    public ResenaDTO.Response obtenerPorId(Long id) {
        Resena resena = buscarPorId(id);
        return toResponse(resena);
    }

    public List<ResenaDTO.Response> obtenerPorUsuario(Long idusuario) {
        return resenaRepository.findByUsuarioIdusuario(idusuario).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ResenaDTO.Response> obtenerPorLibro(Long idlibro) {
        return resenaRepository.findByLibroIdlibro(idlibro).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ResenaDTO.Response> obtenerPublicas() {
        return resenaRepository.findByEsPublicaTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ResenaDTO.Response actualizar(Long id, ResenaDTO.UpdateRequest request) {
        Resena resena = buscarPorId(id);

        if (request.getTexto() != null) resena.setTexto(request.getTexto());
        if (request.getPuntuacion() != null) resena.setPuntuacion(request.getPuntuacion());
        if (request.getPuntestilo() != null) resena.setPuntestilo(request.getPuntestilo());
        if (request.getPuntritmo() != null) resena.setPuntritmo(request.getPuntritmo());
        if (request.getPuntpersonajes() != null) resena.setPuntpersonajes(request.getPuntpersonajes());
        if (request.getEsPublica() != null) resena.setEsPublica(request.getEsPublica());
        if (request.getTieneSpoiler() != null) resena.setTieneSpoiler(request.getTieneSpoiler());

        resena = resenaRepository.save(resena);
        return toResponse(resena);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!resenaRepository.existsById(id)) {
            throw new EntityNotFoundException("Reseña no encontrada");
        }
        resenaRepository.deleteById(id);
    }

    // === LIKES ===

    @Transactional
    public void darLike(Long resenaId, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Resena resena = buscarPorId(resenaId);
        usuario.getResenasLikeadas().add(resena);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void quitarLike(Long resenaId, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Resena resena = buscarPorId(resenaId);
        usuario.getResenasLikeadas().remove(resena);
        usuarioRepository.save(usuario);
    }

    // === HELPERS ===

    private Resena buscarPorId(Long id) {
        return resenaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reseña no encontrada con id: " + id));
    }

    private ResenaDTO.Response toResponse(Resena resena) {
        return ResenaDTO.Response.builder()
                .idresena(resena.getIdresena())
                .texto(resena.getTexto())
                .puntuacion(resena.getPuntuacion())
                .puntestilo(resena.getPuntestilo())
                .puntritmo(resena.getPuntritmo())
                .puntpersonajes(resena.getPuntpersonajes())
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
