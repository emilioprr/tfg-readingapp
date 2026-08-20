package com.readingapp.reading_app.service;

import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleBooksService {

    private final RestTemplate restTemplate;
    private final AutorRepository autorRepository;
    private final LibroRepository libroRepository;

    @Value("${google.books.api.key}")
    private String apiKey;

    private static final String GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes?q={query}&startIndex={startIndex}&maxResults={maxResults}&langRestrict={lang}&key={key}";

    @Transactional
    public int importarPorCategoria(String query, int cantidad, String idioma) {
        int importados = 0;
        int maxResultsPorPagina = 40;

        for (int startIndex = 0; startIndex < cantidad; startIndex += maxResultsPorPagina) {
            int resultadosAPedir = Math.min(maxResultsPorPagina, cantidad - startIndex);

            try {
                Map<String, Object> response = restTemplate.getForObject(
                        GOOGLE_BOOKS_URL,
                        Map.class,
                        query, startIndex, resultadosAPedir, idioma, apiKey
                );

                if (response == null || !response.containsKey("items")) {
                    log.info("No hay más resultados para '{}' en índice {}", query, startIndex);
                    break;
                }

                List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");

                for (Map<String, Object> item : items) {
                    try {
                        if (guardarLibro(item)) {
                            importados++;
                        }
                    } catch (Exception e) {
                        log.warn("Error al procesar libro: {}", e.getMessage());
                    }
                }

                Thread.sleep(500);

            } catch (Exception e) {
                log.error("Error en la petición a Google Books: {}", e.getMessage());
                break;
            }
        }

        log.info("Importación completada: {} libros importados para '{}'", importados, query);
        return importados;
    }

    @Transactional
    public Map<String, Integer> importarMultiplesCategorias(List<String> categorias, int cantidadPorCategoria, String idioma) {
        Map<String, Integer> resultado = new LinkedHashMap<>();

        for (String categoria : categorias) {
            String query = "subject:" + categoria;
            int importados = importarPorCategoria(query, cantidadPorCategoria, idioma);
            resultado.put(categoria, importados);
        }

        return resultado;
    }

    @Transactional
    public boolean importarPorIsbn(String isbn) {
        try {
            // Verificar si ya existe por ISBN
            if (libroRepository.existsByIsbn(isbn)) {
                log.info("Libro con ISBN {} ya existe en la BD", isbn);
                return false;
            }

            Map<String, Object> response = restTemplate.getForObject(
                    GOOGLE_BOOKS_URL,
                    Map.class,
                    "isbn:" + isbn, 0, 1, "", apiKey
            );

            if (response == null || !response.containsKey("items")) {
                return false;
            }

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
            return guardarLibro(items.get(0));

        } catch (Exception e) {
            log.error("Error al importar ISBN {}: {}", isbn, e.getMessage());
            return false;
        }
    }

    private boolean guardarLibro(Map<String, Object> item) {
        Map<String, Object> volumeInfo = (Map<String, Object>) item.get("volumeInfo");
        if (volumeInfo == null) return false;

        String titulo = (String) volumeInfo.get("title");
        if (titulo == null) return false;

        // Verificar duplicado por ID externo
        String idExterno = (String) item.get("id");
        if (idExterno != null && libroRepository.existsByIdapiexterna(idExterno)) {
            return false;
        }

        // Obtener ISBN
        String isbn = extraerIsbn(volumeInfo);

        // Verificar duplicado por ISBN
        if (isbn != null && libroRepository.existsByIsbn(isbn)) {
            return false;
        }

        // Obtener o crear autor
        List<String> autores = (List<String>) volumeInfo.get("authors");
        String nombreAutor = (autores != null && !autores.isEmpty()) ? autores.get(0).trim() : "Desconocido";
        Autor autor = obtenerOCrearAutor(nombreAutor);

        // Obtener datos del libro
        String sinopsis = (String) volumeInfo.get("description");
        Integer paginas = volumeInfo.get("pageCount") != null ? ((Number) volumeInfo.get("pageCount")).intValue() : null;
        String fechaPublicacion = (String) volumeInfo.get("publishedDate");
        Integer anio = extraerAnio(fechaPublicacion);

        // Obtener portada
        String portada = null;
        Map<String, Object> imageLinks = (Map<String, Object>) volumeInfo.get("imageLinks");
        if (imageLinks != null) {
            portada = (String) imageLinks.getOrDefault("thumbnail", imageLinks.get("smallThumbnail"));
        }

        // Obtener género
        List<String> categorias = (List<String>) volumeInfo.get("categories");
        String genero = (categorias != null && !categorias.isEmpty()) ? categorias.get(0) : null;

        // Crear y guardar libro
        Libro libro = Libro.builder()
                .idapiexterna(idExterno)
                .titulo(titulo)
                .sinopsis(sinopsis)
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

    private Autor obtenerOCrearAutor(String nombre) {
        // Normalizar nombre: quitar espacios extra
        String nombreNormalizado = nombre.trim().replaceAll("\\s+", " ");

        List<Autor> existentes = autorRepository.findByNombreContainingIgnoreCase(nombreNormalizado);

        // Buscar coincidencia exacta (ignorando mayúsculas)
        for (Autor a : existentes) {
            if (a.getNombre().trim().equalsIgnoreCase(nombreNormalizado)) {
                return a;
            }
        }

        // Crear nuevo autor
        Autor autor = Autor.builder()
                .nombre(nombreNormalizado)
                .seguidores(0)
                .build();
        return autorRepository.save(autor);
    }

    private Integer extraerAnio(String fecha) {
        if (fecha == null || fecha.length() < 4) return null;
        try {
            return Integer.parseInt(fecha.substring(0, 4));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String extraerIsbn(Map<String, Object> volumeInfo) {
        List<Map<String, String>> identifiers = (List<Map<String, String>>) volumeInfo.get("industryIdentifiers");
        if (identifiers == null) return null;

        for (Map<String, String> id : identifiers) {
            if ("ISBN_13".equals(id.get("type"))) return id.get("identifier");
        }
        for (Map<String, String> id : identifiers) {
            if ("ISBN_10".equals(id.get("type"))) return id.get("identifier");
        }
        return null;
    }
}
