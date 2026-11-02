package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.LibroDTO;
import com.readingapp.reading_app.dto.ListaDTO;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.LikeLista;
import com.readingapp.reading_app.model.Lista;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.LikeListaRepository;
import com.readingapp.reading_app.repository.ListaRepository;
import com.readingapp.reading_app.repository.NotificacionRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListaService {

    private final ListaRepository listaRepository;
    private final LibroRepository libroRepository;
    private final UsuarioRepository usuarioRepository;
    private final LikeListaRepository likeListaRepository;
    private final NotificacionRepository notificacionRepository;
    private final NotificacionService notificacionService;

    @Transactional
    public ListaDTO.Response crear(Long usuarioId, ListaDTO.CreateRequest request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        Lista lista = Lista.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .esPublica(request.getEsPublica() != null ? request.getEsPublica() : true)
                .fechaCreacion(java.time.LocalDateTime.now())
                .usuario(usuario)
                .build();

        lista = listaRepository.save(lista);
        return toResponse(lista);
    }

    public ListaDTO.DetalleResponse obtenerPorId(Long id) {
        Lista lista = buscarPorId(id);
        if (!lista.getEsPublica()) {
            SecurityUtils.validarUsuarioOAdmin(lista.getUsuario().getIdusuario());
        }
        return toDetalleResponse(lista);
    }

    /*El propio usuario ve todas sus listas; los demás solo las públicas.*/
    public List<ListaDTO.Response> obtenerPorUsuario(Long usuarioId) {
        boolean esPropio = SecurityUtils.esUsuarioActual(usuarioId);
        return conLikes(listaRepository.findByUsuarioIdusuario(usuarioId).stream()
                .filter(lista -> esPropio || lista.getEsPublica())
                .toList());
    }

    /** Tus listas indicando en cuáles está ya un libro, para la ventana "Guardar en lista" de su ficha. */
    @Transactional(readOnly = true)
    public List<ListaDTO.Response> obtenerMiasParaLibro(Long usuarioId, Long idlibro) {
        SecurityUtils.validarUsuario(usuarioId);
        return listaRepository.findByUsuarioIdusuario(usuarioId).stream()
                .map(lista -> {
                    ListaDTO.Response r = toResponse(lista);
                    r.setContieneLibro(lista.getLibros().stream().anyMatch(l -> l.getIdlibro().equals(idlibro)));
                    return r;
                })
                .toList();
    }

    public List<ListaDTO.Response> obtenerPublicas() {
        return conLikes(listaRepository.findByEsPublicaTrue());
    }

    @Transactional
    public ListaDTO.Response actualizar(Long id, ListaDTO.UpdateRequest request) {
        Lista lista = buscarPorId(id);
        SecurityUtils.validarUsuario(lista.getUsuario().getIdusuario());
        if (request.getNombre() != null) lista.setNombre(request.getNombre());
        if (request.getDescripcion() != null) lista.setDescripcion(request.getDescripcion());
        if (request.getEsPublica() != null) lista.setEsPublica(request.getEsPublica());
        lista = listaRepository.save(lista);
        return toResponse(lista);
    }

    @Transactional
    public void eliminar(Long id) {
        Lista lista = buscarPorId(id);
        SecurityUtils.validarUsuarioOAdmin(lista.getUsuario().getIdusuario());
        likeListaRepository.borrarDeLista(id);
        notificacionRepository.deleteByListaIdlista(id);
        listaRepository.deleteById(id);
    }

    // === LIKES ===

    /** Da like a una lista pública (o propia). Dar like dos veces no hace nada. */
    @Transactional
    public void darLike(Long idlista) {
        Lista lista = buscarPorId(idlista);
        Long idusuario = SecurityUtils.getUsuarioAutenticadoId();
        boolean propia = lista.getUsuario().getIdusuario().equals(idusuario);
        if (!Boolean.TRUE.equals(lista.getEsPublica()) && !propia) {
            throw new AccessDeniedException("Esta lista es privada");
        }
        if (!likeListaRepository.existsByUsuarioIdusuarioAndListaIdlista(idusuario, idlista)) {
            Usuario usuario = usuarioRepository.findById(idusuario)
                    .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
            likeListaRepository.save(LikeLista.builder().usuario(usuario).lista(lista).fecha(LocalDateTime.now()).build());
            if (!propia) notificacionService.crearNotificacionLikeLista(lista, usuario);
        }
    }

    @Transactional
    public void quitarLike(Long idlista) {
        likeListaRepository.quitar(SecurityUtils.getUsuarioAutenticadoId(), idlista);
    }

    /** Listas que le gustan al usuario de la sesión (página "Likes"). */
    @Transactional(readOnly = true)
    public List<ListaDTO.Response> obtenerLikeadas(Long usuarioId) {
        SecurityUtils.validarUsuario(usuarioId);
        return conLikes(likeListaRepository.findListasLikeadas(usuarioId));
    }

    // === GESTIÓN DE LIBROS EN LISTA ===

    @Transactional
    public void agregarLibro(Long idlista, Long idlibro) {
        Lista lista = buscarPorId(idlista);
        SecurityUtils.validarUsuario(lista.getUsuario().getIdusuario());
        Libro libro = libroRepository.findById(idlibro)
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));
        if (!lista.getLibros().add(libro)) {
            throw new IllegalArgumentException("Este libro ya está en la lista");
        }
        listaRepository.save(lista);
    }

    @Transactional
    public void quitarLibro(Long idlista, Long idlibro) {
        Lista lista = buscarPorId(idlista);
        SecurityUtils.validarUsuario(lista.getUsuario().getIdusuario());
        lista.getLibros().removeIf(l -> l.getIdlibro().equals(idlibro));
        listaRepository.save(lista);
    }

    // === HELPERS ===

    private Lista buscarPorId(Long id) {
        return listaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lista no encontrada con id: " + id));
    }

    /** Respuestas de varias listas con sus likes, con dos consultas para todas. */
    private List<ListaDTO.Response> conLikes(List<Lista> listas) {
        if (listas.isEmpty()) return List.of();
        List<Long> ids = listas.stream().map(Lista::getIdlista).toList();
        Map<Long, Long> likes = likeListaRepository.contarPorLista(ids).stream()
                .collect(Collectors.toMap(f -> (Long) f[0], f -> ((Number) f[1]).longValue()));
        Long idusuario = SecurityUtils.usuarioActualId();
        Set<Long> mias = idusuario == null ? Set.of() : new HashSet<>(likeListaRepository.findIdsLikeadas(idusuario, ids));
        return listas.stream().map(lista -> {
            ListaDTO.Response r = toResponse(lista);
            r.setNumLikes(likes.getOrDefault(lista.getIdlista(), 0L));
            r.setLikeada(mias.contains(lista.getIdlista()));
            return r;
        }).toList();
    }

    private ListaDTO.Response toResponse(Lista lista) {
        return ListaDTO.Response.builder()
                .idlista(lista.getIdlista())
                .nombre(lista.getNombre())
                .descripcion(lista.getDescripcion())
                .esPublica(lista.getEsPublica())
                .fechaCreacion(lista.getFechaCreacion() != null ? lista.getFechaCreacion().toString() : null)
                .idusuario(lista.getUsuario().getIdusuario())
                .nombreUsuario(lista.getUsuario().getNombre())
                .numLibros(lista.getLibros() != null ? lista.getLibros().size() : 0)
                .build();
    }

    private ListaDTO.DetalleResponse toDetalleResponse(Lista lista) {
        List<LibroDTO.Response> libros = lista.getLibros().stream()
                .map(libro -> LibroDTO.Response.builder()
                        .idlibro(libro.getIdlibro())
                        .titulo(libro.getTitulo())
                        .portada(libro.getPortada())
                        .genero(libro.getGenero())
                        .nombreAutor(libro.getAutor().getNombre())
                        .idautor(libro.getAutor().getIdautor())
                        .build())
                .toList();

        return ListaDTO.DetalleResponse.builder()
                .idlista(lista.getIdlista())
                .nombre(lista.getNombre())
                .descripcion(lista.getDescripcion())
                .esPublica(lista.getEsPublica())
                .fechaCreacion(lista.getFechaCreacion() != null ? lista.getFechaCreacion().toString() : null)
                .idusuario(lista.getUsuario().getIdusuario())
                .nombreUsuario(lista.getUsuario().getNombre())
                .libros(libros)
                .numLikes(likeListaRepository.contarPorLista(List.of(lista.getIdlista())).stream()
                        .findFirst().map(f -> ((Number) f[1]).longValue()).orElse(0L))
                .likeada(SecurityUtils.usuarioActualId() != null && likeListaRepository
                        .existsByUsuarioIdusuarioAndListaIdlista(SecurityUtils.usuarioActualId(), lista.getIdlista()))
                .build();
    }
}
