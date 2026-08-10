package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.LibroDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LibroService {

    private final LibroRepository libroRepository;
    private final AutorRepository autorRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;
    private final GoogleBooksService googleBooksService;

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

    public List<LibroDTO.Response> obtenerTodos() {
        return libroRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    /*Busca libros por título en la BD local. Si no encuentra resultados, busca en Google Books, importa 10 resultados y los devuelve.*/
    @Transactional
    public List<LibroDTO.Response> buscarPorTitulo(String titulo) {
        List<Libro> resultados = libroRepository.findByTituloContainingIgnoreCase(titulo);

        if (resultados.isEmpty()) {
            // No hay resultados locales, buscar en Google Books e importar
            int importados = googleBooksService.importarPorCategoria("intitle:" + titulo, 10, "");

            if (importados > 0) {
                // Volver a buscar en la BD con los libros recién importados
                resultados = libroRepository.findByTituloContainingIgnoreCase(titulo);
            }
        }

        return resultados.stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LibroDTO.Response> buscarPorGenero(String genero) {
        return libroRepository.findByGeneroIgnoreCase(genero).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LibroDTO.Response> obtenerPorAutor(Long idautor) {
        return libroRepository.findByAutorIdautor(idautor).stream()
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

    // === HELPERS ===

    public Libro buscarPorId(Long id) {
        return libroRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado con id: " + id));
    }

    private LibroDTO.Response toResponse(Libro libro) {
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
                .build();
    }
}
