package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.NotificacionDTO;
import com.readingapp.reading_app.model.*;
import com.readingapp.reading_app.model.enums.ModalidadReto;
import com.readingapp.reading_app.model.enums.TipoNotificacion;
import com.readingapp.reading_app.repository.NotificacionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    public List<NotificacionDTO.Response> obtenerTodas(Long idusuario, Pageable pageable) {
        return notificacionRepository.findByUsuarioIdusuarioOrderByFechaDesc(idusuario, pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<NotificacionDTO.Response> obtenerNoLeidas(Long idusuario,  Pageable pageable) {
        return notificacionRepository.findByUsuarioIdusuarioAndLeidaFalseOrderByFechaDesc(idusuario, pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<NotificacionDTO.Response> obtenerPorTipo(Long idusuario, TipoNotificacion tipo, Pageable pageable) {
        return notificacionRepository.findByUsuarioIdusuarioAndTipoOrderByFechaDesc(idusuario, tipo, pageable).stream()
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
        SecurityUtils.validarUsuario(notificacion.getUsuario().getIdusuario());
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
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notificación no encontrada"));
        SecurityUtils.validarUsuario(notificacion.getUsuario().getIdusuario());
        notificacionRepository.delete(notificacion);
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
                .fecha(LocalDateTime.now())
                .leida(false)
                .build();
        notificacionRepository.save(notificacion);
    }

    /** Avisa al autor de una cita de que a alguien le ha gustado; una sola vez por persona, aunque quite y vuelva a dar like. */
    @Transactional
    public void crearNotificacionLikeCita(Anotacion cita, Usuario usuarioOrigen) {
        if (notificacionRepository.existsByTipoAndAnotacionIdanotacionAndUsuarioOrigenIdusuario(
                TipoNotificacion.LIKE_CITA, cita.getIdanotacion(), usuarioOrigen.getIdusuario())) {
            return;
        }
        Notificacion notificacion = Notificacion.builder()
                .tipo(TipoNotificacion.LIKE_CITA)
                .mensaje("A " + usuarioOrigen.getNombre() + " le ha gustado tu cita de " + cita.getLibro().getTitulo())
                .usuario(cita.getUsuario())
                .anotacion(cita)
                .libro(cita.getLibro())
                .usuarioOrigen(usuarioOrigen)
                .fecha(LocalDateTime.now())
                .leida(false)
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
                .libro(recomendacion.getLibro())
                .usuarioOrigen(recomendacion.getEmisor())
                .fecha(LocalDateTime.now())
                .leida(false)
                .build();
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void crearNotificacionSeguidor(Usuario seguido, Usuario seguidor) {
        Notificacion notificacion = Notificacion.builder()
                .tipo(TipoNotificacion.NUEVO_SEGUIDOR)
                .mensaje(seguidor.getNombre() + " empezó a seguirte")
                .fecha(java.time.LocalDateTime.now())
                .usuario(seguido)
                .usuarioOrigen(seguidor)
                .leida(false)
                .build();
        notificacionRepository.save(notificacion);
    }

    /**
     * Avisa a un participante de que ha completado un reto (en los colaborativos, entre todos).
     * Sus seguidores no se notifican: lo ven en su feed de actividad.
     */
    @Transactional
    public void crearNotificacionRetoCumplido(Reto reto, Usuario participante) {
        String mensaje = reto.getModalidad() == ModalidadReto.COLABORATIVO
                ? "¡Habéis completado el reto \"" + reto.getTitulo() + "\"!"
                : "¡Has completado el reto \"" + reto.getTitulo() + "\"!";

        Notificacion notif = Notificacion.builder()
                .tipo(TipoNotificacion.RETO_CUMPLIDO)
                .mensaje(mensaje)
                .fecha(LocalDateTime.now())
                .leida(false)
                .usuario(participante)
                .usuarioOrigen(participante)
                .reto(reto)
                .build();
        notificacionRepository.save(notif);
    }

    @Transactional
    public void crearNotificacionNuevoLibro(Libro libro, Usuario seguidor) {
        Notificacion notificacion = Notificacion.builder()
                .tipo(TipoNotificacion.NUEVO_LIBRO_AUTOR)
                .mensaje("Nuevo libro de " + libro.getAutor().getNombre() + ": " + libro.getTitulo())
                .usuario(seguidor)
                .libro(libro)
                .leida(false)
                .fecha(LocalDateTime.now())
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
                .idanotacion(notificacion.getAnotacion() != null ? notificacion.getAnotacion().getIdanotacion() : null)
                .build();
    }
}
