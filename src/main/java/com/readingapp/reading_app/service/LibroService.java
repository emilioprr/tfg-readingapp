package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.LibroDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import com.readingapp.reading_app.repository.ValoracionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LibroService {

    private final LibroRepository libroRepository;
    private final AutorRepository autorRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;
    private final ResenaRepository resenaRepository;
    private final ValoracionRepository valoracionRepository;
    private final NotasLibros notasLibros;
    private final GoogleBooksService googleBooksService;

    @Transactional
    public LibroDTO.Response crear(LibroDTO.CreateRequest request) {
        SecurityUtils.validarAdmin();
        Autor autor = autorRepository.findById(request.getIdautor())
                .orElseThrow(() -> new EntityNotFoundException("Autor no encontrado"));

        Libro libro = Libro.builder()
                .idapiexterna(request.getIdapiexterna())
                .titulo(request.getTitulo())
                .sinopsis(request.getSinopsis())
                .anioPublicacion(request.getAnioPublicacion())
                .numPaginas(request.getNumPaginas())
                .isbn(request.getIsbn())
                .portada(request.getPortada())
                .genero(request.getGenero())
                .autor(autor)
                .build();

        libro = libroRepository.save(libro);

        for (Usuario seguidor : autor.getSeguidoresList()) {
            notificacionService.crearNotificacionNuevoLibro(libro, seguidor);
        }

        return toDetalle(libro);
    }

    public LibroDTO.Response obtenerPorId(Long id) {
        Libro libro = buscarPorId(id);
        return toDetalle(libro);
    }

    public List<LibroDTO.Response> obtenerTodos(Pageable pageable) {
        return toResumenes(libroRepository.findAll(pageable).getContent());
    }

    public Page<LibroDTO.Response> buscarPorTitulo(String titulo, Pageable pageable) {
        Page<Libro> pagina = libroRepository.findByTituloContainingIgnoreCase(titulo, pageable);
        Map<Long, NotasLibros.Nota> notas = notasDe(pagina.getContent());
        return pagina.map(l -> toResumen(l, notas));
    }

    public List<LibroDTO.Response> buscarPorGenero(String genero, Pageable pageable) {
        return toResumenes(libroRepository.findByGeneroIgnoreCase(genero, pageable));
    }

    public List<LibroDTO.Response> obtenerPorAutor(Long idautor, Pageable pageable) {
        return toResumenes(libroRepository.findByAutorIdautor(idautor, pageable));
    }

    @Transactional
    public LibroDTO.Response actualizar(Long id, LibroDTO.UpdateRequest request) {
        SecurityUtils.validarAdmin();
        Libro libro = buscarPorId(id);

        if (request.getTitulo() != null) libro.setTitulo(request.getTitulo());
        if (request.getSinopsis() != null) libro.setSinopsis(request.getSinopsis());
        if (request.getAnioPublicacion() != null) libro.setAnioPublicacion(request.getAnioPublicacion());
        if (request.getNumPaginas() != null) libro.setNumPaginas(request.getNumPaginas());
        if (request.getIsbn() != null) libro.setIsbn(request.getIsbn());
        if (request.getPortada() != null) libro.setPortada(request.getPortada());
        if (request.getGenero() != null) libro.setGenero(request.getGenero());

        libro = libroRepository.save(libro);
        return toDetalle(libro);
    }

    @Transactional
    public void eliminar(Long id) {
        SecurityUtils.validarAdmin();
        if (!libroRepository.existsById(id)) {
            throw new EntityNotFoundException("Libro no encontrado");
        }
        valoracionRepository.borrarDeLibro(id);
        libroRepository.deleteById(id);
    }

    // === FAVORITOS ===

    @Transactional
    public void agregarFavorito(Long usuarioId, Long libroId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Libro libro = buscarPorId(libroId);
        usuario.getLibrosFavoritos().add(libro);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void quitarFavorito(Long usuarioId, Long libroId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        Libro libro = buscarPorId(libroId);
        usuario.getLibrosFavoritos().remove(libro);
        usuarioRepository.save(usuario);
    }

    public List<LibroDTO.Response> obtenerFavoritos(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        return toResumenes(new ArrayList<>(usuario.getLibrosFavoritos()));
    }

    public List<String> obtenerGeneros() {
        return libroRepository.findGenerosDistintos();
    }

    public List<LibroDTO.Response> obtenerPopulares(Pageable pageable) {
        LocalDateTime hace30Dias = LocalDateTime.now().minusDays(30);
        return toResumenes(libroRepository.findPopulares(hace30Dias, pageable));
    }

    public List<LibroDTO.Response> obtenerPopularesEntreSeguidos(Long idusuario, Pageable pageable) {
        return toResumenes(libroRepository.findLibrosPopularesEntreSeguidos(idusuario, pageable));
    }

    private Map<String, Long> calcularDistribucion(Long idlibro) {
        Map<String, Long> dist = new java.util.LinkedHashMap<>();
        for (double d = 0.5; d <= 5.0; d += 0.5) {
            dist.put(String.valueOf(d), 0L);
        }
        // Reseñas y puntuaciones sin reseña se suman en la misma barra
        List<Object[]> rows = new ArrayList<>(resenaRepository.findDistribucionByLibro(idlibro));
        rows.addAll(valoracionRepository.findDistribucionByLibro(idlibro));
        for (Object[] row : rows) {
            if (row[0] == null) continue;
            String key = String.valueOf(((Number) row[0]).doubleValue());
            dist.merge(key, ((Number) row[1]).longValue(), Long::sum);
        }
        return dist;
    }

    private List<String> calcularEtiquetasPopulares(Long idlibro) {
        return resenaRepository.findEtiquetasPopularesByLibro(idlibro).stream()
                .limit(5)
                .map(row -> row[0].toString())
                .toList();
    }

    // === HELPERS ===

    public Libro buscarPorId(Long id) {
        return libroRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado con id: " + id));
    }

    /** Ficha completa de un libro (página de detalle): incluye distribución de notas, ritmo y etiquetas. */
    private LibroDTO.Response toDetalle(Libro libro) {
        LibroDTO.Response r = toResumen(libro, notasDe(List.of(libro)));
        r.setRitmoMedio(resenaRepository.findRitmoMedioByLibro(libro.getIdlibro()));
        r.setDistribucionNotas(calcularDistribucion(libro.getIdlibro()));
        r.setEtiquetasPopulares(calcularEtiquetasPopulares(libro.getIdlibro()));
        return r;
    }

    /** Listados: datos básicos y nota media, con una sola consulta de notas para todos los libros. */
    private List<LibroDTO.Response> toResumenes(List<Libro> libros) {
        Map<Long, NotasLibros.Nota> notas = notasDe(libros);
        return libros.stream().map(l -> toResumen(l, notas)).toList();
    }

    /** idlibro -> nota media, nº de valoraciones y nº de reseñas públicas. */
    private Map<Long, NotasLibros.Nota> notasDe(List<Libro> libros) {
        return notasLibros.de(libros.stream().map(Libro::getIdlibro).toList());
    }

    private LibroDTO.Response toResumen(Libro libro, Map<Long, NotasLibros.Nota> notas) {
        NotasLibros.Nota nota = notas.get(libro.getIdlibro());
        return LibroDTO.Response.builder()
                .idlibro(libro.getIdlibro())
                .idapiexterna(libro.getIdapiexterna())
                .titulo(libro.getTitulo())
                .sinopsis(libro.getSinopsis())
                .anioPublicacion(libro.getAnioPublicacion())
                .numPaginas(libro.getNumPaginas())
                .isbn(libro.getIsbn())
                .portada(libro.getPortada())
                .genero(libro.getGenero())
                .nombreAutor(libro.getAutor().getNombre())
                .idautor(libro.getAutor().getIdautor())
                .notaMedia(nota != null ? nota.media() : null)
                .numResenas(nota != null ? (int) nota.resenas() : 0)
                .numValoraciones(nota != null ? (int) nota.valoraciones() : 0)
                .build();
    }
}
