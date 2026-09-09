package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.SesionLecturaDTO;
import com.readingapp.reading_app.model.*;
import com.readingapp.reading_app.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SesionLecturaService {

    private final SesionLecturaRepository sesionLecturaRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;
    private final RetoService retoService;

    @Transactional
    public SesionLecturaDTO.Response registrar(SesionLecturaDTO.CreateRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdusuario())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Libro libro = null;
        if (request.getIdlibro() != null) {
            libro = libroRepository.findById(request.getIdlibro())
                    .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));
        }

        LocalDateTime ahora = LocalDateTime.now();

        SesionLectura sesion = SesionLectura.builder()
                .usuario(usuario)
                .libro(libro)
                .inicio(ahora.minusMinutes(request.getDuracionMinutos()))
                .fin(ahora)
                .duracionMinutos(request.getDuracionMinutos())
                .build();

        sesion = sesionLecturaRepository.save(sesion);

        // Recalcular retos de HORAS activos
        retoService.recalcularRetosActivosDeUsuario(request.getIdusuario());

        return toResponse(sesion);
    }

    public Page<SesionLecturaDTO.Response> obtenerPorUsuario(Long idusuario, Pageable pageable) {
        return sesionLecturaRepository.findByUsuarioIdusuario(idusuario, pageable).map(this::toResponse);
    }

    public SesionLecturaDTO.ResumenResponse obtenerResumen(Long idusuario) {
        int totalMinutos = sesionLecturaRepository.sumMinutosByUsuario(idusuario);
        return SesionLecturaDTO.ResumenResponse.builder()
                .idusuario(idusuario)
                .totalMinutos(totalMinutos)
                .totalHoras(Math.round(totalMinutos / 60.0 * 10.0) / 10.0)
                .build();
    }

    private SesionLecturaDTO.Response toResponse(SesionLectura sesion) {
        return SesionLecturaDTO.Response.builder()
                .idsesion(sesion.getIdsesion())
                .idusuario(sesion.getUsuario().getIdusuario())
                .nombreUsuario(sesion.getUsuario().getNombre())
                .idlibro(sesion.getLibro().getIdlibro())
                .tituloLibro(sesion.getLibro().getTitulo())
                .inicio(sesion.getInicio().toString())
                .fin(sesion.getFin() != null ? sesion.getFin().toString() : null)
                .duracionMinutos(sesion.getDuracionMinutos())
                .build();
    }
}

