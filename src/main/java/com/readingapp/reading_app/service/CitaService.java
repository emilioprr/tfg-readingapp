package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.CitaDTO;
import com.readingapp.reading_app.model.Anotacion;
import com.readingapp.reading_app.model.LikeCita;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import com.readingapp.reading_app.repository.AnotacionRepository;
import com.readingapp.reading_app.repository.LikeCitaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Muro de citas de la comunidad (con likes) y citas que cada usuario guarda y muestra en su perfil. */
@Service
@RequiredArgsConstructor
public class CitaService {

    /** Ventana de tiempo en la que cuentan los likes para el orden "populares". */
    static final int DIAS_POPULARES = 7;

    private final AnotacionRepository anotacionRepository;
    private final LikeCitaRepository likeCitaRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    /** Citas públicas de la comunidad: "populares" (más likes de la semana) o "recientes". */
    @Transactional(readOnly = true)
    public CitaDTO.Pagina obtenerComunidad(String orden, int pagina, int tamanio) {
        PageRequest pageable = PageRequest.of(pagina, tamanio);
        if (!"populares".equals(orden)) {
            return aPagina(anotacionRepository.findByTipoAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(
                    TipoAnotacion.CITA, pageable));
        }
        Page<Long> ids = anotacionRepository.findIdsCitasPopulares(
                LocalDateTime.now().minusDays(DIAS_POPULARES), pageable);
        // findAllById no respeta el orden: se recoloca según la lista de ids
        Map<Long, Anotacion> porId = anotacionRepository.findAllById(ids.getContent()).stream()
                .collect(Collectors.toMap(Anotacion::getIdanotacion, Function.identity()));
        List<Anotacion> ordenadas = ids.getContent().stream().map(porId::get).filter(Objects::nonNull).toList();
        return aPagina(new PageImpl<>(ordenadas, pageable, ids.getTotalElements()));
    }

    /** Citas guardadas de un usuario, para la pestaña "Mural de citas" de su perfil. */
    @Transactional(readOnly = true)
    public CitaDTO.Pagina obtenerGuardadas(Long idusuario, int pagina, int tamanio) {
        return aPagina(anotacionRepository.findCitasGuardadas(
                idusuario, SecurityUtils.getUsuarioAutenticadoId(), PageRequest.of(pagina, tamanio)));
    }

    /** Guarda una cita pública (o propia) en la colección del usuario. */
    @Transactional
    public void guardar(Long idanotacion) {
        Usuario usuario = usuarioActual();
        Anotacion cita = citaVisible(idanotacion, usuario.getIdusuario());
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

    /** Da like a una cita pública de otro usuario (las propias no, para no inflar las populares). Dar like dos veces no hace nada. */
    @Transactional
    public void darLike(Long idanotacion) {
        Usuario usuario = usuarioActual();
        Anotacion cita = citaVisible(idanotacion, usuario.getIdusuario());
        if (cita.getUsuario().getIdusuario().equals(usuario.getIdusuario())) {
            throw new IllegalArgumentException("No puedes dar like a tus propias citas");
        }
        if (!likeCitaRepository.existsByUsuarioIdusuarioAndAnotacionIdanotacion(usuario.getIdusuario(), idanotacion)) {
            likeCitaRepository.save(LikeCita.builder().usuario(usuario).anotacion(cita).fecha(LocalDateTime.now()).build());
            notificacionService.crearNotificacionLikeCita(cita, usuario);
        }
    }

    @Transactional
    public void quitarLike(Long idanotacion) {
        likeCitaRepository.quitar(SecurityUtils.getUsuarioAutenticadoId(), idanotacion);
    }

    // === HELPERS ===

    private Usuario usuarioActual() {
        return usuarioRepository.findById(SecurityUtils.getUsuarioAutenticadoId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }

    /** La cita existe, es una cita y el usuario puede verla (es pública o suya). */
    private Anotacion citaVisible(Long idanotacion, Long idusuario) {
        Anotacion cita = anotacionRepository.findById(idanotacion)
                .orElseThrow(() -> new EntityNotFoundException("Cita no encontrada"));
        if (cita.getTipo() != TipoAnotacion.CITA) {
            throw new IllegalArgumentException("Solo se pueden guardar o likear citas");
        }
        boolean propia = cita.getUsuario().getIdusuario().equals(idusuario);
        if (!Boolean.TRUE.equals(cita.getEsPublica()) && !propia) {
            throw new IllegalArgumentException("Esta cita es privada");
        }
        return cita;
    }

    private CitaDTO.Pagina aPagina(Page<Anotacion> pagina) {
        List<Anotacion> citas = pagina.getContent();
        List<Long> ids = citas.stream().map(Anotacion::getIdanotacion).toList();
        Long idusuario = SecurityUtils.getUsuarioAutenticadoId();

        Set<Long> guardadas = ids.isEmpty() ? Set.of() : new HashSet<>(anotacionRepository.findIdsGuardadas(idusuario, ids));
        Set<Long> likeadas = ids.isEmpty() ? Set.of() : new HashSet<>(likeCitaRepository.findIdsLikeadas(idusuario, ids));
        Map<Long, Long> likes = ids.isEmpty() ? Map.of() : aMapa(likeCitaRepository.contarPorCita(ids));
        Map<Long, Long> guardados = ids.isEmpty() ? Map.of() : aMapa(anotacionRepository.contarGuardados(ids));

        return CitaDTO.Pagina.builder()
                .citas(citas.stream().map(a -> {
                    Long id = a.getIdanotacion();
                    return toResponse(a, guardadas.contains(id), likeadas.contains(id),
                            likes.getOrDefault(id, 0L), guardados.getOrDefault(id, 0L));
                }).toList())
                .pagina(pagina.getNumber())
                .hayMas(pagina.hasNext())
                .build();
    }

    /** Filas [idanotacion, cantidad] a un mapa id → cantidad. */
    private Map<Long, Long> aMapa(List<Object[]> filas) {
        return filas.stream().collect(Collectors.toMap(f -> (Long) f[0], f -> ((Number) f[1]).longValue()));
    }

    private CitaDTO.Response toResponse(Anotacion a, boolean guardada, boolean likeada, long likes, long vecesGuardada) {
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
                .likeada(likeada)
                .likes(likes)
                .vecesGuardada(vecesGuardada)
                .build();
    }
}
