package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.RecomendacionDTO;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Recomendacion;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.RecomendacionRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecomendacionService {

    private final RecomendacionRepository recomendacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;
    private final NotificacionService notificacionService;

    @Transactional
    public RecomendacionDTO.Response crear(RecomendacionDTO.CreateRequest request) {
        if (request.getIdusuarioEmisor().equals(request.getIdusuarioReceptor())) {
            throw new IllegalArgumentException("No puedes recomendarte un libro a ti mismo");
        }

        Usuario emisor = usuarioRepository.findById(request.getIdusuarioEmisor())
                .orElseThrow(() -> new EntityNotFoundException("Emisor no encontrado"));
        Usuario receptor = usuarioRepository.findById(request.getIdusuarioReceptor())
                .orElseThrow(() -> new EntityNotFoundException("Receptor no encontrado"));
        Libro libro = libroRepository.findById(request.getIdlibro())
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));

        Recomendacion recomendacion = Recomendacion.builder()
                .mensaje(request.getMensaje())
                .emisor(emisor)
                .receptor(receptor)
                .libro(libro)
                .esAutomatica(false)
                .build();

        recomendacion = recomendacionRepository.save(recomendacion);

        // Crear notificación para el receptor
        notificacionService.crearNotificacionRecomendacion(recomendacion);

        return toResponse(recomendacion);
    }

    public List<RecomendacionDTO.Response> obtenerRecibidas(Long idusuario) {
        return recomendacionRepository.findByReceptorIdusuario(idusuario).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RecomendacionDTO.Response> obtenerEnviadas(Long idusuario) {
        return recomendacionRepository.findByEmisorIdusuario(idusuario).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RecomendacionDTO.Response> obtenerNoVistas(Long idusuario) {
        return recomendacionRepository.findByReceptorIdusuarioAndVistoFalse(idusuario).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void marcarVista(Long id) {
        Recomendacion recomendacion = recomendacionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Recomendación no encontrada"));
        recomendacion.setVisto(true);
        recomendacionRepository.save(recomendacion);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!recomendacionRepository.existsById(id)) {
            throw new EntityNotFoundException("Recomendación no encontrada");
        }
        recomendacionRepository.deleteById(id);
    }

    // === HELPERS ===

    private RecomendacionDTO.Response toResponse(Recomendacion recomendacion) {
        return RecomendacionDTO.Response.builder()
                .idrecomendacion(recomendacion.getIdrecomendacion())
                .mensaje(recomendacion.getMensaje())
                .fecha(recomendacion.getFecha() != null ? recomendacion.getFecha().toString() : null)
                .visto(recomendacion.getVisto())
                .esAutomatica(recomendacion.getEsAutomatica())
                .idusuarioEmisor(recomendacion.getEmisor() != null ? recomendacion.getEmisor().getIdusuario() : null)
                .nombreEmisor(recomendacion.getEmisor() != null ? recomendacion.getEmisor().getNombre() : "Sistema")
                .idusuarioReceptor(recomendacion.getReceptor().getIdusuario())
                .nombreReceptor(recomendacion.getReceptor().getNombre())
                .idlibro(recomendacion.getLibro().getIdlibro())
                .tituloLibro(recomendacion.getLibro().getTitulo())
                .portadaLibro(recomendacion.getLibro().getPortada())
                .build();
    }
}
