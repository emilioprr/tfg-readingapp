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
    private final OpenLibraryService openLibraryService;

    @Value("${google.books.api.key}")
    private String apiKey;

    private static final String GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes?q={query}&startIndex={startIndex}&maxResults={maxResults}&langRestrict={lang}&key={key}";

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

    public int importarPorTitulo(String titulo, int cantidad) {
        int importados = 0;
        try {
            Map<String, Object> response = restTemplate.getForObject(
                    GOOGLE_BOOKS_URL, Map.class, titulo, 0, Math.min(cantidad, 40), "es", apiKey
            );
            if (response == null || !response.containsKey("items")) return 0;

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
            for (Map<String, Object> item : items) {
                try {
                    if (guardarLibro(item)) importados++;
                } catch (Exception e) {
                    log.warn("Error al procesar libro: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error buscando en Google Books: {}", e.getMessage());
        }
        return importados;
    }


    public int importarPopulares(int cantidad, String idioma) {
        String[] librosPopulares = {
                "Harry Potter", "El señor de los anillos", "Cien años de soledad",
                "1984 Orwell", "Don Quijote", "El principito",
                "Juego de tronos", "Los juegos del hambre", "Divergente",
                "Percy Jackson", "Crepúsculo", "Maze Runner",
                "El código Da Vinci", "La sombra del viento", "La chica del tren",
                "It Stephen King", "El resplandor", "Drácula",
                "Orgullo y prejuicio", "Jane Eyre", "Cumbres borrascosas",
                "Sapiens Harari", "Hábitos atómicos", "El poder del ahora",
                "El alquimista Coelho", "La ladrona de libros", "El nombre del viento",
                "Dune Herbert", "Fundación Asimov", "Fahrenheit 451",
                "Crimen y castigo", "El gran Gatsby", "Matar a un ruiseñor",
                "Rebelión en la granja", "Un mundo feliz", "El retrato de Dorian Gray",
                "Crónica de una muerte anunciada", "El amor en los tiempos del cólera",
                "La casa de los espíritus", "Como agua para chocolate",
                "Rayuela Cortázar", "Pedro Páramo", "El túnel Sabato",
                "Los pilares de la tierra", "El médico Noah Gordon",
                "El nombre de la rosa", "El perfume Süskind",
                "Bajo la misma estrella", "Yo antes de ti", "Normal People",
                "Eleanor Oliphant", "Un hombre llamado Ove",
                "Las ventajas de ser invisible", "Ready Player One",
                "El marciano Andy Weir", "Proyecto Hail Mary",
                "Cazadores de sombras", "Trono de cristal",
                "La selección Kiera Cass", "Caraval",
                "Donde los árboles cantan", "Marina Ruiz Zafón",
                "El prisionero del cielo", "El juego del ángel",
                "La catedral del mar", "Patria Fernando Aramburu",
                "La ciudad y los perros", "Conversación en La Catedral",
                "Ficciones Borges", "El Aleph Borges",
                "Ensayo sobre la ceguera", "Las intermitencias de la muerte",
                "Tokio Blues Murakami", "Kafka en la orilla",
                "Norwegian Wood", "1Q84 Murakami",
                "El extranjero Camus", "La peste Camus",
                "El lobo estepario", "Demian Hermann Hesse", "Siddhartha",
                "Frankenstein Mary Shelley", "El llamado de Cthulhu",
                "Coraline Neil Gaiman", "American Gods",
                "Good Omens", "El oceano al final del camino",
                "Ender's Game", "Neuromante Gibson",
                "2001 odisea del espacio", "Solaris Stanislaw Lem",
                "El problema de los tres cuerpos", "El bosque oscuro Liu Cixin",
                "Padre rico padre pobre", "El monje que vendió su Ferrari",
                "Los 7 hábitos", "Pensar rápido pensar despacio",
                "El sutil arte", "Inteligencia emocional Goleman",
                "Diario de Ana Frank", "Steve Jobs Walter Isaacson"
        };

        int importados = 0;
        for (String titulo : librosPopulares) {
            try {
                Map<String, Object> response = restTemplate.getForObject(
                        GOOGLE_BOOKS_URL, Map.class, titulo, 0, 1, idioma, apiKey
                );

                if (response == null || !response.containsKey("items")) continue;

                List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
                if (!items.isEmpty()) {
                    if (guardarLibro(items.get(0))) importados++;
                }
                Thread.sleep(300);
            } catch (Exception e) {
                log.warn("Error importando '{}': {}", titulo, e.getMessage());
            }
        }
        log.info("Importados {} libros populares", importados);
        return importados;
    }


    private boolean guardarLibro(Map<String, Object> item) {
        Map<String, Object> volumeInfo = (Map<String, Object>) item.get("volumeInfo");
        if (volumeInfo == null) return false;

        String titulo = (String) volumeInfo.get("title");
        if (titulo == null) return false;

        String idExterno = (String) item.get("id");
        if (idExterno != null && libroRepository.existsByIdapiexterna(idExterno)) {
            log.info("Rechazado por ID externo: {}", titulo);
            return false;
        }

        List<String> autores = (List<String>) volumeInfo.get("authors");
        String nombreAutor = (autores != null && !autores.isEmpty()) ? autores.get(0) : "Desconocido";

        if (libroRepository.existsByTituloYAutorNormalizado(titulo, nombreAutor)) {
            log.info("Rechazado por título+autor duplicado: {}", titulo);
            return false;
        }

        String isbn = extraerIsbn(volumeInfo);
        if (isbn != null && libroRepository.existsByIsbn(isbn)) {
            log.info("Rechazado por ISBN duplicado: {}", titulo);
            return false;
        }

        Autor autor = obtenerOCrearAutor(nombreAutor);

        String sinopsis = (String) volumeInfo.get("description");
        Integer paginas = volumeInfo.get("pageCount") != null ? ((Number) volumeInfo.get("pageCount")).intValue() : null;
        String fechaPublicacion = (String) volumeInfo.get("publishedDate");
        Integer anio = extraerAnio(fechaPublicacion);

        String portada = null;
        Map<String, Object> imageLinks = (Map<String, Object>) volumeInfo.get("imageLinks");
        if (imageLinks != null) {
            portada = (String) imageLinks.getOrDefault("thumbnail", imageLinks.get("smallThumbnail"));
        }

        List<String> categorias = (List<String>) volumeInfo.get("categories");
        String genero = (categorias != null && !categorias.isEmpty()) ? categorias.get(0) : "Ficción";

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
        log.info("GUARDADO OK: '{}' de '{}'", titulo, autor.getNombre());
        return true;
    }

    private Autor obtenerOCrearAutor(String nombre) {
        String nombreNormalizado = nombre.trim().replaceAll("\\s+", " ");

        return autorRepository.findByNombreNormalizado(nombreNormalizado)
                .orElseGet(() -> {
                    Autor autor = Autor.builder()
                            .nombre(nombreNormalizado)
                            .seguidores(0)
                            .build();
                    autor = autorRepository.save(autor);
                    try {
                        openLibraryService.enriquecerAutor(autor);
                    } catch (Exception e) {
                        log.warn("No se pudo enriquecer autor {}: {}", nombreNormalizado, e.getMessage());
                    }
                    return autor;
                });
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
