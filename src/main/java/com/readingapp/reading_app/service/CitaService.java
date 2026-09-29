package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.CitaDTO;
import com.readingapp.reading_app.model.Anotacion;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import com.readingapp.reading_app.repository.AnotacionRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Muro de citas de la comunidad y citas que cada usuario guarda y muestra en su perfil. */
@Service
@RequiredArgsConstructor
public class CitaService {

    private final AnotacionRepository anotacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public CitaDTO.Pagina obtenerComunidad(int pagina, int tamanio) {
        return aPagina(anotacionRepository.findByTipoAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(
                TipoAnotacion.CITA, PageRequest.of(pagina, tamanio)));
    }

    /** Citas guardadas de un usuario, para la pestaña "Citas" de su perfil. */
    @Transactional(readOnly = true)
    public CitaDTO.Pagina obtenerGuardadas(Long idusuario, int pagina, int tamanio) {
        return aPagina(anotacionRepository.findCitasGuardadas(
                idusuario, SecurityUtils.getUsuarioAutenticadoId(), PageRequest.of(pagina, tamanio)));
    }

    /** Guarda una cita pública (o propia) en la colección del usuario. */
    @Transactional
    public void guardar(Long idanotacion) {
        Usuario usuario = usuarioActual();
        Anotacion cita = anotacionRepository.findById(idanotacion)
                .orElseThrow(() -> new EntityNotFoundException("Cita no encontrada"));
        if (cita.getTipo() != TipoAnotacion.CITA) {
            throw new IllegalArgumentException("Solo se pueden guardar citas");
        }
        boolean propia = cita.getUsuario().getIdusuario().equals(usuario.getIdusuario());
        if (!Boolean.TRUE.equals(cita.getEsPublica()) && !propia) {
            throw new IllegalArgumentException("Esta cita es privada");
        }
        if (usuario.getCitasGuardadas() == null) usuario.setCitasGuardadas(new HashSet<>());
        usuario.getCitasGuardadas().add(cita);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void quitar(Long idanotacion) {
        Usuario usuario = usuarioActual();
        if (usuario.getCitasGuardadas() != null) {
            usuario.getCitasGuardadas().removeIf(a -> a.getIdanotacion().equals(idanotacion));
            usuarioRepository.save(usuario);
        }
    }

    // === HELPERS ===

    private Usuario usuarioActual() {
        return usuarioRepository.findById(SecurityUtils.getUsuarioAutenticadoId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }

    private CitaDTO.Pagina aPagina(Page<Anotacion> pagina) {
        List<Anotacion> citas = pagina.getContent();
        Set<Long> guardadas = citas.isEmpty() ? Set.of() : new HashSet<>(anotacionRepository.findIdsGuardadas(
                SecurityUtils.getUsuarioAutenticadoId(), citas.stream().map(Anotacion::getIdanotacion).toList()));
        return CitaDTO.Pagina.builder()
                .citas(citas.stream().map(a -> toResponse(a, guardadas.contains(a.getIdanotacion()))).toList())
                .pagina(pagina.getNumber())
                .hayMas(pagina.hasNext())
                .build();
    }

    private CitaDTO.Response toResponse(Anotacion a, boolean guardada) {
        return CitaDTO.Response.builder()
                .idanotacion(a.getIdanotacion())
                .texto(a.getTexto())
                .parte(a.getParte())
                .tieneSpoiler(a.getTieneSpoiler())
                .fecha(a.getFecha() != null ? a.getFecha().toString() : null)
                .idusuario(a.getUsuario().getIdusuario())
                .nombreUsuario(a.getUsuario().getNombre())
                .avatarUsuario(a.getUsuario().getAvatar())
                .idlibro(a.getLibro().getIdlibro())
                .tituloLibro(a.getLibro().getTitulo())
                .portadaLibro(a.getLibro().getPortada())
                .nombreAutor(a.getLibro().getAutor() != null ? a.getLibro().getAutor().getNombre() : null)
                .guardada(guardada)
                .build();
    }
}
