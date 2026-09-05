package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.LibroDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LibroService {

    private final LibroRepository libroRepository;
    private final AutorRepository autorRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;
    private final OpenLibraryService openLibraryService;
    private final ResenaRepository resenaRepository;

    @Transactional
    public LibroDTO.Response crear(LibroDTO.CreateRequest request) {
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

        return toResponse(libro);
    }

    public LibroDTO.Response obtenerPorId(Long id) {
        Libro libro = buscarPorId(id);
        return toResponse(libro);
    }

    public List<LibroDTO.Response> obtenerTodos(Pageable pageable) {
        return libroRepository.findAll(pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    /*Busca libros por título en la BD local. Si no encuentra resultados, busca en OpenLibrary, importa 10 resultados y los devuelve.*/
    @Transactional
    public Page<LibroDTO.Response> buscarPorTitulo(String titulo, Pageable pageable) {
        Page<Libro> resultados = libroRepository.findByTituloContainingIgnoreCase(titulo, pageable);

        if (resultados.isEmpty()) {
            // No hay resultados locales, buscar en OpenLibrary e importar
            int importados = openLibraryService.importarPorTitulo(titulo, 20);

            if (importados > 0) {
                // Volver a buscar en la BD con los libros recién importados
                resultados = libroRepository.findByTituloContainingIgnoreCase(titulo, pageable);
            }
        }

        return resultados.map(this::toResponse);

    }

    public List<LibroDTO.Response> buscarPorGenero(String genero, Pageable pageable) {
        return libroRepository.findByGeneroIgnoreCase(genero, pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LibroDTO.Response> obtenerPorAutor(Long idautor, Pageable pageable) {
        return libroRepository.findByAutorIdautor(idautor, pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LibroDTO.Response actualizar(Long id, LibroDTO.UpdateRequest request) {
        Libro libro = buscarPorId(id);

        if (request.getTitulo() != null) libro.setTitulo(request.getTitulo());
        if (request.getSinopsis() != null) libro.setSinopsis(request.getSinopsis());
        if (request.getAnioPublicacion() != null) libro.setAnioPublicacion(request.getAnioPublicacion());
        if (request.getNumPaginas() != null) libro.setNumPaginas(request.getNumPaginas());
        if (request.getIsbn() != null) libro.setIsbn(request.getIsbn());
        if (request.getPortada() != null) libro.setPortada(request.getPortada());
        if (request.getGenero() != null) libro.setGenero(request.getGenero());

        libro = libroRepository.save(libro);
        return toResponse(libro);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!libroRepository.existsById(id)) {
            throw new EntityNotFoundException("Libro no encontrado");
        }
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
        return usuario.getLibrosFavoritos().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<String> obtenerGeneros() {
        return libroRepository.findGenerosDistintos();
    }

    public List<LibroDTO.Response> obtenerPopulares(Pageable pageable) {
        return libroRepository.findPopulares(pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LibroDTO.Response> obtenerPopularesEntreSeguidos(Long idusuario, Pageable pageable) {
        return libroRepository.findLibrosPopularesEntreSeguidos(idusuario, pageable).stream()
                .map(this::toResponse)
                .toList();
    }

    private Map<String, Long> calcularDistribucion(Long idlibro) {
        Map<String, Long> dist = new java.util.LinkedHashMap<>();
        for (double d = 0.5; d <= 5.0; d += 0.5) {
            dist.put(String.valueOf(d), 0L);
        }
        List<Object[]> rows = resenaRepository.findDistribucionByLibro(idlibro);
        for (Object[] row : rows) {
            String key = row[0].toString();
            if (key.endsWith(".0")) key = key.substring(0, key.length() - 2) + ".0";
            long count = ((Number) row[1]).longValue();
            dist.put(key, count);
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

    private LibroDTO.Response toResponse(Libro libro) {
        Double media = resenaRepository.findNotaMediaByLibro(libro.getIdlibro());
        long count = resenaRepository.countByLibroIdlibroAndEsPublicaTrue(libro.getIdlibro());

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
                .notaMedia(media != null ? Math.round(media * 20.0) / 10.0 : null)
                .numResenas((int) count)
                .ritmoMedio(resenaRepository.findRitmoMedioByLibro(libro.getIdlibro()))
                .distribucionNotas(calcularDistribucion(libro.getIdlibro()))
                .etiquetasPopulares(calcularEtiquetasPopulares(libro.getIdlibro()))
                .build();
    }
}
