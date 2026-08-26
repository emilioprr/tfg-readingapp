package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.AnotacionDTO;
import com.readingapp.reading_app.model.Anotacion;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Seguimiento;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import com.readingapp.reading_app.repository.AnotacionRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AnotacionService {

    private final AnotacionRepository anotacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;
    private final SeguimientoRepository seguimientoRepository;

    @Transactional
    public AnotacionDTO.Response crear(AnotacionDTO.CreateRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdusuario())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Libro libro = libroRepository.findById(request.getIdlibro())
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));

        Optional<Seguimiento> ultimo = seguimientoRepository
                .findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(
                        usuario.getIdusuario(), libro.getIdlibro());
        if (ultimo.isEmpty() || ultimo.get().getEstado() != EstadoLectura.LEYENDO) {
            throw new IllegalArgumentException("Solo puedes anotar un libro que estés leyendo actualmente");
        }

        Anotacion anotacion = Anotacion.builder()
                .texto(request.getTexto())
                .parte(request.getParte())
                .tipo(request.getTipo())
                .esPublica(request.getEsPublica() != null ? request.getEsPublica() : false)
                .tieneSpoiler(request.getTieneSpoiler() != null ? request.getTieneSpoiler() : false)
                .usuario(usuario)
                .libro(libro)
                .fecha(LocalDateTime.now())
                .build();

        anotacion = anotacionRepository.save(anotacion);
        return toResponse(anotacion);
    }

    public AnotacionDTO.Response obtenerPorId(Long id) {
        Anotacion anotacion = buscarPorId(id);
        return toResponse(anotacion);
    }

    public List<AnotacionDTO.Response> obtenerPorUsuario(Long idusuario, Pageable pageable) {
        return anotacionRepository.findByUsuarioIdusuario(idusuario, pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AnotacionDTO.Response> obtenerPorLibro(Long idlibro, Pageable pageable) {
        return anotacionRepository.findByLibroIdlibro(idlibro, pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AnotacionDTO.Response> obtenerPorUsuarioYLibro(Long idusuario, Long idlibro) {
        return anotacionRepository.findByUsuarioIdusuarioAndLibroIdlibro(idusuario, idlibro).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AnotacionDTO.Response> obtenerPorUsuarioYTipo(Long idusuario, TipoAnotacion tipo, Pageable pageable) {
        return anotacionRepository.findByUsuarioIdusuarioAndTipo(idusuario, tipo, pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AnotacionDTO.Response actualizar(Long id, AnotacionDTO.UpdateRequest request) {
        Anotacion anotacion = anotacionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Anotación no encontrada con id: " + id));
        SecurityUtils.validarUsuario(anotacion.getUsuario().getIdusuario());
        if (request.getTexto() != null) anotacion.setTexto(request.getTexto());
        if (request.getParte() != null) anotacion.setParte(request.getParte());
        if (request.getTipo() != null) anotacion.setTipo(request.getTipo());
        if (request.getEsPublica() != null) anotacion.setEsPublica(request.getEsPublica());
        if (request.getTieneSpoiler() != null) anotacion.setTieneSpoiler(request.getTieneSpoiler());
        anotacion = anotacionRepository.save(anotacion);
        return toResponse(anotacion);
    }

    @Transactional
    public void eliminar(Long id) {
        Anotacion anotacion = anotacionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Anotación no encontrada con id: " + id));
        SecurityUtils.validarUsuario(anotacion.getUsuario().getIdusuario());
        anotacionRepository.deleteById(id);
    }

    // === HELPERS ===

    private Anotacion buscarPorId(Long id) {
        return anotacionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Anotación no encontrada con id: " + id));
    }

    private AnotacionDTO.Response toResponse(Anotacion anotacion) {
        return AnotacionDTO.Response.builder()
                .idanotacion(anotacion.getIdanotacion())
                .texto(anotacion.getTexto())
                .parte(anotacion.getParte())
                .tipo(anotacion.getTipo())
                .esPublica(anotacion.getEsPublica())
                .tieneSpoiler(anotacion.getTieneSpoiler())
                .fecha(anotacion.getFecha() != null ? anotacion.getFecha().toString() : null)
                .idusuario(anotacion.getUsuario().getIdusuario())
                .nombreUsuario(anotacion.getUsuario().getNombre())
                .idlibro(anotacion.getLibro().getIdlibro())
                .tituloLibro(anotacion.getLibro().getTitulo())
                .build();
    }
}
