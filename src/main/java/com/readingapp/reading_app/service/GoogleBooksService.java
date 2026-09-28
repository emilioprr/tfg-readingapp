package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.LibroDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

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

    // Caché de búsquedas: cada entrada es la respuesta de una petición (consulta + página)
    private static final Duration DURACION_CACHE = Duration.ofHours(6);
    private static final int MAX_ENTRADAS_CACHE = 1000;
    private record EntradaCache(List<Map<String, Object>> items, Instant caduca) {}
    private final Map<String, EntradaCache> cacheBusquedas = new ConcurrentHashMap<>();

    private static final String GOOGLE_BOOKS_URL =
            "https://www.googleapis.com/books/v1/volumes?q={query}&startIndex={startIndex}&maxResults={maxResults}&langRestrict={lang}&key={key}";
    private static final String GOOGLE_SEARCH_URL =
            "https://www.googleapis.com/books/v1/volumes?q={query}&startIndex={startIndex}&maxResults=40&printType=books&key={key}";
    private static final String GOOGLE_VOLUME_URL =
            "https://www.googleapis.com/books/v1/volumes/{id}?key={key}";

    // ==================== CARGA MASIVA (ADMIN) ====================

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

    // ==================== BÚSQUEDA (SIN GUARDAR) ====================

    /**
     * Busca en Google Books SIN guardar nada. Excluye los libros que ya existen en local.
     *
     * La primera tanda combina una búsqueda por título ("intitle") con la búsqueda general y la reordena
     * por relevancia propia (ver {@link RelevanciaBusqueda}); las siguientes tandas continúan la búsqueda
     * general. En ambos casos se deja una sola edición de cada obra.
     */
    public Map<String, Object> buscarEnGoogle(String query, int startIndex) {
        List<Map<String, Object>> candidatos = new ArrayList<>();
        int index = startIndex;
        boolean agotado = false;

        if (startIndex == 0) {
            String frase = "\"" + query.replace("\"", "") + "\"";
            // Google Books a veces responde vacío de forma puntual: se reintenta una vez porque es la búsqueda que más aporta
            List<Map<String, Object>> porTitulo = pedirGoogle("intitle:" + frase, 0);
            if (porTitulo.isEmpty()) porTitulo = pedirGoogle("intitle:" + frase, 0);
            candidatos.addAll(porTitulo);
            candidatos.addAll(pedirGoogle("inauthor:" + frase, 0));
        }

        // Al menos una petición de la búsqueda general (hasta 3 si hace falta para tener una tanda decente)
        int peticiones = 0;
        while (peticiones == 0 || (candidatos.size() < 20 && peticiones < 3)) {
            peticiones++;
            List<Map<String, Object>> items = pedirGoogle(query, index);
            if (items.isEmpty()) {
                agotado = true;
                break;
            }
            index += items.size();
            candidatos.addAll(items);
        }

        return Map.of("resultados", ordenarPorRelevancia(candidatos, query),
                "siguienteIndex", index, "hayMas", !agotado);
    }

    /**
     * Una petición a Google Books, con caché en memoria: las búsquedas repetidas ("harry potter", "el principito"...)
     * no gastan cuota y responden al instante. Las respuestas vacías no se guardan, porque a veces son fallos puntuales.
     */
    private List<Map<String, Object>> pedirGoogle(String query, int startIndex) {
        String clave = query.trim().toLowerCase() + "|" + startIndex;
        EntradaCache enCache = cacheBusquedas.get(clave);
        if (enCache != null && enCache.caduca().isAfter(Instant.now())) return enCache.items();

        try {
            Map<String, Object> response = restTemplate.getForObject(GOOGLE_SEARCH_URL, Map.class, query, startIndex, apiKey);
            if (response == null || !response.containsKey("items")) return List.of();
            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
            guardarEnCache(clave, items);
            return items;
        } catch (Exception e) {
            log.error("Error buscando en Google Books: {}", e.getMessage());
            return List.of();
        }
    }

    private void guardarEnCache(String clave, List<Map<String, Object>> items) {
        if (cacheBusquedas.size() >= MAX_ENTRADAS_CACHE) {
            cacheBusquedas.values().removeIf(e -> e.caduca().isBefore(Instant.now()));
            if (cacheBusquedas.size() >= MAX_ENTRADAS_CACHE) cacheBusquedas.clear();
        }
        cacheBusquedas.put(clave, new EntradaCache(items, Instant.now().plus(DURACION_CACHE)));
    }

    /** Quita repetidos, libros ya existentes en local y ediciones duplicadas; ordena por relevancia. */
    private List<LibroDTO.BusquedaResponse> ordenarPorRelevancia(List<Map<String, Object>> items, String query) {
        record Valido(LibroDTO.BusquedaResponse libro, Map<String, Object> info, int posicion) {}
        record Puntuado(LibroDTO.BusquedaResponse libro, double puntos, int posicion) {}

        List<Valido> validos = new ArrayList<>();
        Set<String> vistos = new HashSet<>();
        for (int i = 0; i < items.size(); i++) {
            Map<String, Object> item = items.get(i);
            String idExterno = (String) item.get("id");
            if (idExterno == null || !vistos.add(idExterno)) continue;

            LibroDTO.BusquedaResponse dto = toBusquedaDTO(item);
            if (dto == null || buscarLocalEquivalente(item).isPresent()) continue;
            validos.add(new Valido(dto, (Map<String, Object>) item.get("volumeInfo"), i));
        }

        boolean busquedaDeAutor = RelevanciaBusqueda.esBusquedaDeAutor(query,
                validos.stream().map(v -> v.libro().getNombreAutor()).toList());

        List<Puntuado> puntuados = new ArrayList<>();
        for (Valido v : validos) {
            Number valoraciones = (Number) v.info().get("ratingsCount");
            double puntos = RelevanciaBusqueda.puntuar(query, new RelevanciaBusqueda.Candidato(
                            v.libro().getTitulo(), v.libro().getNombreAutor(),
                            valoraciones != null ? valoraciones.intValue() : null,
                            v.libro().getPortada() != null, v.libro().getSinopsis() != null,
                            (String) v.info().get("language")),
                    busquedaDeAutor);
            puntuados.add(new Puntuado(v.libro(), puntos, v.posicion()));
        }

        // Mejor puntuación primero; a igualdad, se respeta el orden de Google
        puntuados.sort(Comparator.comparingDouble(Puntuado::puntos).reversed().thenComparingInt(Puntuado::posicion));

        // Una sola edición por obra: la mejor puntuada
        List<LibroDTO.BusquedaResponse> resultado = new ArrayList<>();
        for (Puntuado p : puntuados) {
            LibroDTO.BusquedaResponse libro = p.libro();
            boolean repetido = resultado.stream().anyMatch(r -> RelevanciaBusqueda.mismaObra(
                    r.getTitulo(), r.getNombreAutor(), libro.getTitulo(), libro.getNombreAutor()));
            if (!repetido) resultado.add(libro);
        }
        return resultado;
    }

    /** Importa UN libro concreto cuando el usuario lo abre. Devuelve su id local. */
    @Transactional
    public Long importarPorIdExterno(String idExterno) {
        Map<String, Object> item = restTemplate.getForObject(GOOGLE_VOLUME_URL, Map.class, idExterno, apiKey);
        if (item == null) throw new EntityNotFoundException("Libro no encontrado en Google Books");

        Optional<Libro> existente = buscarLocalEquivalente(item);
        if (existente.isPresent()) return existente.get().getIdlibro();

        guardarLibro(item);

        return buscarLocalEquivalente(item)
                .map(Libro::getIdlibro)
                .orElseThrow(() -> new IllegalArgumentException("No se pudo importar el libro"));
    }

    /** Busca si ya existe en local un libro equivalente (mismo id externo, ISBN o título+autor). */
    private Optional<Libro> buscarLocalEquivalente(Map<String, Object> item) {
        String idExterno = (String) item.get("id");
        if (idExterno != null) {
            Optional<Libro> porId = libroRepository.findFirstByIdapiexterna(idExterno);
            if (porId.isPresent()) return porId;
        }

        Map<String, Object> volumeInfo = (Map<String, Object>) item.get("volumeInfo");
        if (volumeInfo == null) return Optional.empty();

        String isbn = extraerIsbn(volumeInfo);
        if (isbn != null) {
            Optional<Libro> porIsbn = libroRepository.findFirstByIsbn(isbn);
            if (porIsbn.isPresent()) return porIsbn;
        }

        String titulo = (String) volumeInfo.get("title");
        if (titulo == null) return Optional.empty();
        List<String> autores = (List<String>) volumeInfo.get("authors");
        String nombreAutor = (autores != null && !autores.isEmpty()) ? autores.get(0) : "Desconocido";

        return libroRepository.buscarPorTituloYAutorNormalizado(titulo, nombreAutor);
    }

    private LibroDTO.BusquedaResponse toBusquedaDTO(Map<String, Object> item) {
        Map<String, Object> volumeInfo = (Map<String, Object>) item.get("volumeInfo");
        if (volumeInfo == null || volumeInfo.get("title") == null) return null;

        List<String> autores = (List<String>) volumeInfo.get("authors");
        if (autores == null || autores.isEmpty()) return null;

        List<String> categorias = (List<String>) volumeInfo.get("categories");

        return LibroDTO.BusquedaResponse.builder()
                .idExterno((String) item.get("id"))
                .titulo((String) volumeInfo.get("title"))
                .nombreAutor(autores.get(0))
                .portada(extraerPortada(volumeInfo))
                .sinopsis((String) volumeInfo.get("description"))
                .numPaginas(volumeInfo.get("pageCount") != null ? ((Number) volumeInfo.get("pageCount")).intValue() : null)
                .genero(categorias != null && !categorias.isEmpty() ? categorias.get(0) : null)
                .externo(true)
                .build();
    }

    // ==================== GUARDADO ====================

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
        Integer anio = extraerAnio((String) volumeInfo.get("publishedDate"));

        List<String> categorias = (List<String>) volumeInfo.get("categories");
        String genero = (categorias != null && !categorias.isEmpty()) ? categorias.get(0) : "Ficción";

        Libro libro = Libro.builder()
                .idapiexterna(idExterno)
                .titulo(titulo)
                .sinopsis(sinopsis)
                .anioPublicacion(anio)
                .numPaginas(paginas)
                .isbn(isbn)
                .portada(extraerPortada(volumeInfo))
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

    // ==================== UTILIDADES ====================

    private String extraerPortada(Map<String, Object> volumeInfo) {
        Map<String, Object> imageLinks = (Map<String, Object>) volumeInfo.get("imageLinks");
        if (imageLinks == null) return null;
        String url = (String) imageLinks.getOrDefault("thumbnail", imageLinks.get("smallThumbnail"));
        return url != null ? url.replace("http://", "https://") : null;
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