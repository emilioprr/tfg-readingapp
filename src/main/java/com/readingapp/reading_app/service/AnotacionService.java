package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.AnotacionDTO;
import com.readingapp.reading_app.model.Anotacion;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import com.readingapp.reading_app.repository.AnotacionRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnotacionService {

    private final AnotacionRepository anotacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;

    @Transactional
    public AnotacionDTO.Response crear(AnotacionDTO.CreateRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getIdusuario())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Libro libro = libroRepository.findById(request.getIdlibro())
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));

        Anotacion anotacion = Anotacion.builder()
                .texto(request.getTexto())
                .parte(request.getParte())
                .tipo(request.getTipo())
                .esPublica(request.getEsPublica() != null ? request.getEsPublica() : false)
                .tieneSpoiler(request.getTieneSpoiler() != null ? request.getTieneSpoiler() : false)
                .usuario(usuario)
                .libro(libro)
                .build();

        anotacion = anotacionRepository.save(anotacion);
        return toResponse(anotacion);
    }

    public AnotacionDTO.Response obtenerPorId(Long id) {
        Anotacion anotacion = buscarPorId(id);
        return toResponse(anotacion);
    }

    public List<AnotacionDTO.Response> obtenerPorUsuario(Long idusuario) {
        return anotacionRepository.findByUsuarioIdusuario(idusuario).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AnotacionDTO.Response> obtenerPorLibro(Long idlibro) {
        return anotacionRepository.findByLibroIdlibro(idlibro).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AnotacionDTO.Response> obtenerPorUsuarioYLibro(Long idusuario, Long idlibro) {
        return anotacionRepository.findByUsuarioIdusuarioAndLibroIdlibro(idusuario, idlibro).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AnotacionDTO.Response> obtenerPorUsuarioYTipo(Long idusuario, TipoAnotacion tipo) {
        return anotacionRepository.findByUsuarioIdusuarioAndTipo(idusuario, tipo).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AnotacionDTO.Response actualizar(Long id, AnotacionDTO.UpdateRequest request) {
        Anotacion anotacion = buscarPorId(id);

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
        if (!anotacionRepository.existsById(id)) {
            throw new EntityNotFoundException("Anotación no encontrada");
        }
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
