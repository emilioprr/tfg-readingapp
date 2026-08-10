package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.NotificacionDTO;
import com.readingapp.reading_app.model.*;
import com.readingapp.reading_app.model.enums.TipoNotificacion;
import com.readingapp.reading_app.repository.NotificacionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    public List<NotificacionDTO.Response> obtenerTodas(Long idusuario) {
        return notificacionRepository.findByUsuarioIdusuarioOrderByFechaDesc(idusuario).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<NotificacionDTO.Response> obtenerNoLeidas(Long idusuario) {
        return notificacionRepository.findByUsuarioIdusuarioAndLeidaFalseOrderByFechaDesc(idusuario).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<NotificacionDTO.Response> obtenerPorTipo(Long idusuario, TipoNotificacion tipo) {
        return notificacionRepository.findByUsuarioIdusuarioAndTipoOrderByFechaDesc(idusuario, tipo).stream()
                .map(this::toResponse)
                .toList();
    }

    public NotificacionDTO.ContadorResponse contarNoLeidas(Long idusuario) {
        long count = notificacionRepository.countByUsuarioIdusuarioAndLeidaFalse(idusuario);
        return NotificacionDTO.ContadorResponse.builder()
                .idusuario(idusuario)
                .noLeidas(count)
                .build();
    }

    @Transactional
    public void marcarLeida(Long id) {
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notificación no encontrada"));
        notificacion.setLeida(true);
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void marcarTodasLeidas(Long idusuario) {
        List<Notificacion> noLeidas = notificacionRepository
                .findByUsuarioIdusuarioAndLeidaFalseOrderByFechaDesc(idusuario);
        noLeidas.forEach(n -> n.setLeida(true));
        notificacionRepository.saveAll(noLeidas);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!notificacionRepository.existsById(id)) {
            throw new EntityNotFoundException("Notificación no encontrada");
        }
        notificacionRepository.deleteById(id);
    }

    // === MÉTODOS PARA CREAR NOTIFICACIONES DESDE OTROS SERVICIOS ===

    @Transactional
    public void crearNotificacionLike(Resena resena, Usuario usuarioOrigen) {
        Notificacion notificacion = Notificacion.builder()
                .tipo(TipoNotificacion.LIKE_RESENA)
                .mensaje(usuarioOrigen.getNombre() + " dio like a tu reseña de " + resena.getLibro().getTitulo())
                .usuario(resena.getUsuario())
                .resena(resena)
                .usuarioOrigen(usuarioOrigen)
                .build();
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void crearNotificacionRecomendacion(Recomendacion recomendacion) {
        Notificacion notificacion = Notificacion.builder()
                .tipo(TipoNotificacion.NUEVA_RECOMENDACION)
                .mensaje(recomendacion.getEmisor().getNombre() + " te recomendó " + recomendacion.getLibro().getTitulo())
                .usuario(recomendacion.getReceptor())
                .recomendacion(recomendacion)
                .usuarioOrigen(recomendacion.getEmisor())
                .build();
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void crearNotificacionSeguidor(Usuario seguido, Usuario seguidor) {
        Notificacion notificacion = Notificacion.builder()
                .tipo(TipoNotificacion.NUEVO_SEGUIDOR)
                .mensaje(seguidor.getNombre() + " empezó a seguirte")
                .usuario(seguido)
                .usuarioOrigen(seguidor)
                .build();
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void crearNotificacionNuevaResena(Resena resena, Usuario seguidor) {
        Notificacion notificacion = Notificacion.builder()
                .tipo(TipoNotificacion.NUEVA_RESENA_SEGUIDO)
                .mensaje(resena.getUsuario().getNombre() + " publicó una reseña de " + resena.getLibro().getTitulo())
                .usuario(seguidor)
                .resena(resena)
                .usuarioOrigen(resena.getUsuario())
                .build();
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void crearNotificacionRetoCumplido(Usuario usuario) {
        Notificacion notificacion = Notificacion.builder()
                .tipo(TipoNotificacion.RETO_CUMPLIDO)
                .mensaje("¡Has cumplido tu reto de lectura!")
                .usuario(usuario)
                .build();
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void crearNotificacionNuevoLibro(Libro libro, Usuario seguidor) {
        Notificacion notificacion = Notificacion.builder()
                .tipo(TipoNotificacion.NUEVO_LIBRO_AUTOR)
                .mensaje("Nuevo libro de " + libro.getAutor().getNombre() + ": " + libro.getTitulo())
                .usuario(seguidor)
                .libro(libro)
                .build();
        notificacionRepository.save(notificacion);
    }

    // === HELPERS ===

    private NotificacionDTO.Response toResponse(Notificacion notificacion) {
        return NotificacionDTO.Response.builder()
                .idnotificacion(notificacion.getIdnotificacion())
                .tipo(notificacion.getTipo())
                .mensaje(notificacion.getMensaje())
                .fecha(notificacion.getFecha() != null ? notificacion.getFecha().toString() : null)
                .leida(notificacion.getLeida())
                .idusuario(notificacion.getUsuario().getIdusuario())
                .idresena(notificacion.getResena() != null ? notificacion.getResena().getIdresena() : null)
                .idrecomendacion(notificacion.getRecomendacion() != null ? notificacion.getRecomendacion().getIdrecomendacion() : null)
                .idusuarioOrigen(notificacion.getUsuarioOrigen() != null ? notificacion.getUsuarioOrigen().getIdusuario() : null)
                .nombreUsuarioOrigen(notificacion.getUsuarioOrigen() != null ? notificacion.getUsuarioOrigen().getNombre() : null)
                .idlibro(notificacion.getLibro() != null ? notificacion.getLibro().getIdlibro() : null)
                .tituloLibro(notificacion.getLibro() != null ? notificacion.getLibro().getTitulo() : null)
                .build();
    }
}
