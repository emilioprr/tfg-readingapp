package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.SeguimientoDTO;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Seguimiento;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SeguimientoService {

    private final SeguimientoRepository seguimientoRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;

    @Transactional
    public SeguimientoDTO.Response registrar(SeguimientoDTO.CreateRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdusuario())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Libro libro = libroRepository.findById(request.getIdlibro())
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));

        // Validar que la página no supere el total del libro
        if (libro.getNumPaginas() != null && request.getNumPagina() > libro.getNumPaginas()) {
            throw new IllegalArgumentException("La página no puede superar el total de páginas del libro");
        }

        Seguimiento seguimiento = Seguimiento.builder()
                .numPagina(request.getNumPagina())
                .estado(request.getEstado())
                .usuario(usuario)
                .libro(libro)
                .build();

        seguimiento = seguimientoRepository.save(seguimiento);
        return toResponse(seguimiento);
    }

    public SeguimientoDTO.Response obtenerPorId(Long id) {
        Seguimiento seguimiento = seguimientoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Seguimiento no encontrado"));
        return toResponse(seguimiento);
    }

    public List<SeguimientoDTO.Response> obtenerPorUsuario(Long idusuario) {
        return seguimientoRepository.findByUsuarioIdusuario(idusuario).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<SeguimientoDTO.Response> obtenerHistorialLibro(Long idusuario, Long idlibro) {
        return seguimientoRepository.findByUsuarioIdusuarioAndLibroIdlibro(idusuario, idlibro).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<SeguimientoDTO.Response> obtenerPorEstado(Long idusuario, EstadoLectura estado) {
        return seguimientoRepository.findByUsuarioIdusuarioAndEstado(idusuario, estado).stream()
                .map(this::toResponse)
                .toList();
    }

    public SeguimientoDTO.Response obtenerUltimoProgreso(Long idusuario, Long idlibro) {
        Seguimiento seguimiento = seguimientoRepository
                .findTopByUsuarioIdusuarioAndLibroIdlibroOrderByFechaDesc(idusuario, idlibro)
                .orElseThrow(() -> new EntityNotFoundException("No hay seguimiento para este libro"));
        return toResponse(seguimiento);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!seguimientoRepository.existsById(id)) {
            throw new EntityNotFoundException("Seguimiento no encontrado");
        }
        seguimientoRepository.deleteById(id);
    }

    // === HELPERS ===

    private SeguimientoDTO.Response toResponse(Seguimiento seguimiento) {
        Integer totalPaginas = seguimiento.getLibro().getNumPaginas();
        Double porcentaje = null;
        if (totalPaginas != null && totalPaginas > 0) {
            porcentaje = Math.round((seguimiento.getNumPagina() * 100.0 / totalPaginas) * 10.0) / 10.0;
        }

        return SeguimientoDTO.Response.builder()
                .idseguimiento(seguimiento.getIdseguimiento())
                .fecha(seguimiento.getFecha() != null ? seguimiento.getFecha().toString() : null)
                .numPagina(seguimiento.getNumPagina())
                .estado(seguimiento.getEstado())
                .idusuario(seguimiento.getUsuario().getIdusuario())
                .nombreUsuario(seguimiento.getUsuario().getNombre())
                .idlibro(seguimiento.getLibro().getIdlibro())
                .tituloLibro(seguimiento.getLibro().getTitulo())
                .totalPaginas(totalPaginas)
                .porcentaje(porcentaje)
                .build();
    }
}

