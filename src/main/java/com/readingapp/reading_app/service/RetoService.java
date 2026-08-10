package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.RetoDTO;
import com.readingapp.reading_app.model.Reto;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.RetoRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RetoService {

    private final RetoRepository retoRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public RetoDTO.Response crear(RetoDTO.CreateRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdusuario())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        // Cerrar el reto activo anterior si existe
        retoRepository.findByUsuarioIdusuarioAndFechafinIsNull(request.getIdusuario())
                .ifPresent(retoActivo -> {
                    retoActivo.setFechafin(LocalDate.now());
                    retoRepository.save(retoActivo);
                });

        Reto reto = Reto.builder()
                .metapaginas(request.getMetapaginas())
                .fechainicio(LocalDate.now())
                .usuario(usuario)
                .build();

        reto = retoRepository.save(reto);
        return toResponse(reto);
    }

    public RetoDTO.Response obtenerActivo(Long idusuario) {
        Reto reto = retoRepository.findByUsuarioIdusuarioAndFechafinIsNull(idusuario)
                .orElseThrow(() -> new EntityNotFoundException("No hay reto activo"));
        return toResponse(reto);
    }

    public List<RetoDTO.Response> obtenerHistorial(Long idusuario) {
        return retoRepository.findByUsuarioIdusuario(idusuario).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RetoDTO.Response marcarCumplido(Long id) {
        Reto reto = retoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reto no encontrado"));
        reto.setRetoCumplido(true);
        reto = retoRepository.save(reto);
        return toResponse(reto);
    }

    @Transactional
    public void cancelar(Long id) {
        Reto reto = retoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reto no encontrado"));
        reto.setFechafin(LocalDate.now());
        retoRepository.save(reto);
    }

    // === HELPERS ===

    private RetoDTO.Response toResponse(Reto reto) {
        return RetoDTO.Response.builder()
                .idreto(reto.getIdreto())
                .metapaginas(reto.getMetapaginas())
                .fechainicio(reto.getFechainicio() != null ? reto.getFechainicio().toString() : null)
                .fechafin(reto.getFechafin() != null ? reto.getFechafin().toString() : null)
                .retoCumplido(reto.getRetoCumplido())
                .idusuario(reto.getUsuario().getIdusuario())
                .nombreUsuario(reto.getUsuario().getNombre())
                .build();
    }
}

