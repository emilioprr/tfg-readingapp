package com.readingapp.reading_app.service;

import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenLibraryService {

    private final RestTemplate restTemplate;
    private final AutorRepository autorRepository;
    private final LibroRepository libroRepository;

    private static final String SEARCH_URL = "https://openlibrary.org/search.json?q={query}&limit={limit}&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,isbn,subject";
    private static final String AUTHOR_SEARCH_URL = "https://openlibrary.org/search/authors.json?q={nombre}&limit=1";
    private static final String AUTHOR_URL = "https://openlibrary.org/authors/{key}.json";
    private static final String COVER_URL = "https://covers.openlibrary.org/b/id/{coverId}-L.jpg";
    private static final String PHOTO_URL = "https://covers.openlibrary.org/a/olid/{key}-L.jpg";

    // === BÚSQUEDA E IMPORTACIÓN DE LIBROS ===

    /*Busca libros en Open Library por título e importa los que no existen. Devuelve obras únicas (no ediciones duplicadas).*/
    @Transactional
    public int importarPorTitulo(String titulo, int cantidad) {
        int importados = 0;

        try {
            Map<String, Object> response = restTemplate.getForObject(
                    SEARCH_URL, Map.class, titulo, cantidad
            );

            if (response == null || (int) response.getOrDefault("numFound", 0) == 0) {
                log.info("No se encontraron resultados en Open Library para '{}'", titulo);
                return 0;
            }

            List<Map<String, Object>> docs = (List<Map<String, Object>>) response.get("docs");
            if (docs == null || docs.isEmpty()) return 0;

            for (Map<String, Object> doc : docs) {
                try {
                    if (guardarLibroDesdeOpenLibrary(doc)) {
                        importados++;
                    }
                    Thread.sleep(200);
                } catch (Exception e) {
                    log.warn("Error al procesar libro de Open Library: {}", e.getMessage());
                }
            }

            log.info("Importación desde Open Library completada: {} libros importados para '{}'", importados, titulo);

        } catch (Exception e) {
            log.error("Error en la petición a Open Library: {}", e.getMessage());
        }

        return importados;
    }

    private boolean guardarLibroDesdeOpenLibrary(Map<String, Object> doc) {
        String titulo = (String) doc.get("title");
        if (titulo == null) return false;

        // Obtener Work ID como identificador externo
        String workKey = (String) doc.get("key");
        String idExterno = workKey != null ? workKey.replace("/works/", "OL_") : null;

        // Verificar duplicado por ID externo
        if (idExterno != null && libroRepository.existsByIdapiexterna(idExterno)) {
            return false;
        }

        // Obtener ISBN (primer ISBN disponible)
        List<String> isbns = (List<String>) doc.get("isbn");
        String isbn = null;
        if (isbns != null && !isbns.isEmpty()) {
            // Preferir ISBN-13
            for (String i : isbns) {
                if (i.length() == 13) { isbn = i; break; }
            }
            if (isbn == null) isbn = isbns.get(0);
        }

        // Verificar duplicado por ISBN
        if (isbn != null && libroRepository.existsByIsbn(isbn)) {
            return false;
        }

        // Obtener autor
        List<String> autores = (List<String>) doc.get("author_name");
        String nombreAutor = (autores != null && !autores.isEmpty()) ? autores.get(0).trim() : "Desconocido";
        Autor autor = obtenerOCrearAutor(nombreAutor);

        // Obtener año de publicación
        Integer anio = doc.get("first_publish_year") != null ? ((Number) doc.get("first_publish_year")).intValue() : null;

        // Obtener número de páginas
        Integer paginas = doc.get("number_of_pages_median") != null ? ((Number) doc.get("number_of_pages_median")).intValue() : null;

        // Obtener portada
        String portada = null;
        if (doc.get("cover_i") != null) {
            int coverId = ((Number) doc.get("cover_i")).intValue();
            portada = COVER_URL.replace("{coverId}", String.valueOf(coverId));
        }

        // Obtener género (primer subject)
        List<String> subjects = (List<String>) doc.get("subject");
        String genero = null;
        if (subjects != null && !subjects.isEmpty()) {
            genero = subjects.get(0);
            if (genero.length() > 100) genero = genero.substring(0, 100);
        }

        Libro libro = Libro.builder()
                .idapiexterna(idExterno)
                .titulo(titulo)
                .anioPublicacion(anio)
                .numPaginas(paginas)
                .isbn(isbn)
                .portada(portada)
                .genero(genero)
                .autor(autor)
                .build();

        libroRepository.save(libro);
        return true;
    }

    // === ENRIQUECIMIENTO DE AUTORES ===

    @Transactional
    public boolean enriquecerAutor(Long idautor) {
        Autor autor = autorRepository.findById(idautor).orElse(null);
        if (autor == null) return false;
        return buscarYActualizar(autor);
    }

    @Transactional
    public int enriquecerAutoresIncompletos() {
        List<Autor> autores = autorRepository.findAll().stream()
                .filter(a -> a.getBiografia() == null && a.getFoto() == null)
                .toList();

        int enriquecidos = 0;
        for (Autor autor : autores) {
            try {
                if (buscarYActualizar(autor)) {
                    enriquecidos++;
                }
                Thread.sleep(1000);
            } catch (Exception e) {
                log.warn("Error al enriquecer autor '{}': {}", autor.getNombre(), e.getMessage());
            }
        }

        log.info("Enriquecimiento completado: {}/{} autores actualizados", enriquecidos, autores.size());
        return enriquecidos;
    }

    // === HELPERS ===

    private Autor obtenerOCrearAutor(String nombre) {
        String nombreNormalizado = nombre.trim().replaceAll("\\s+", " ");

        List<Autor> existentes = autorRepository.findByNombreContainingIgnoreCase(nombreNormalizado);

        for (Autor a : existentes) {
            if (a.getNombre().trim().equalsIgnoreCase(nombreNormalizado)) {
                return a;
            }
        }

        Autor autor = Autor.builder()
                .nombre(nombreNormalizado)
                .seguidores(0)
                .build();
        return autorRepository.save(autor);
    }

    private boolean buscarYActualizar(Autor autor) {
        try {
            Map<String, Object> searchResponse = restTemplate.getForObject(
                    AUTHOR_SEARCH_URL, Map.class, autor.getNombre()
            );

            if (searchResponse == null || (int) searchResponse.getOrDefault("numFound", 0) == 0) {
                return false;
            }

            List<Map<String, Object>> docs = (List<Map<String, Object>>) searchResponse.get("docs");
            if (docs == null || docs.isEmpty()) return false;

            Map<String, Object> primerResultado = docs.get(0);
            String authorKey = (String) primerResultado.get("key");
            if (authorKey == null) return false;

            Map<String, Object> authorData = restTemplate.getForObject(
                    AUTHOR_URL, Map.class, authorKey
            );

            if (authorData == null) return false;

            if (autor.getBiografia() == null) {
                Object bio = authorData.get("bio");
                if (bio instanceof String) {
                    autor.setBiografia((String) bio);
                } else if (bio instanceof Map) {
                    autor.setBiografia((String) ((Map<String, Object>) bio).get("value"));
                }
            }

            if (autor.getFoto() == null) {
                List<Integer> photos = (List<Integer>) authorData.get("photos");
                if (photos != null && !photos.isEmpty()) {
                    autor.setFoto(PHOTO_URL.replace("{key}", authorKey));
                }
            }

            if (autor.getNacionalidad() == null) {
                Object birthPlace = authorData.get("birth_place");
                if (birthPlace instanceof String) {
                    autor.setNacionalidad((String) birthPlace);
                }
            }

            autorRepository.save(autor);
            log.info("Autor enriquecido: {}", autor.getNombre());
            return true;

        } catch (Exception e) {
            log.warn("No se pudo enriquecer al autor '{}': {}", autor.getNombre(), e.getMessage());
            return false;
        }
    }
}