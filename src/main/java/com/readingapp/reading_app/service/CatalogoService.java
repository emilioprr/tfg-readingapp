package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.CatalogoDTO;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.enums.Categoria;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Catálogo tipo Netflix: un libro destacado, filas temáticas y filas por categoría.
 * Las filas son una muestra aleatoria que se mantiene todo el día (por usuario) y se renueva al día siguiente.
 */
@Service
@RequiredArgsConstructor
public class CatalogoService {

    public static final int LIBROS_POR_FILA = 20;
    public static final int MIN_LIBROS_CATEGORIA = 6;
    public static final int MIN_LIBROS_FILA = 4;
    private static final int ANIO_CLASICOS = 1950;
    private static final int LONGITUD_MIN_SINOPSIS = 120;
    private static final double NOTA_MIN_VALORADOS = 3.5; // sobre 5

    private final LibroRepository libroRepository;
    private final NotasLibros notasLibros;
    private final SeguimientoRepository seguimientoRepository;
    private final Clock clock;

    /** Nota media (sobre 5) y nº de valoraciones (reseñas públicas + puntuaciones sin reseña) de un libro. */
    private record Nota(double media, int total) {}

    @Transactional(readOnly = true)
    public CatalogoDTO.Response obtenerCatalogo() {
        List<Libro> libros = librosSinDuplicados();
        Map<Long, Nota> notas = notasPorLibro();
        Map<Categoria, List<Libro>> porCategoria = agruparPorCategoria(libros);
        Function<Libro, CatalogoDTO.LibroResumen> resumen = l -> toResumen(l, notas, false);

        List<CatalogoDTO.Fila> filas = new ArrayList<>();
        Long idusuario = SecurityUtils.usuarioActualId();
        LocalDate hoy = LocalDate.now(clock);

        // Filas especiales
        añadir(filas, "populares", "Populares este mes", null,
                libroRepository.findPopulares(hoy.minusDays(30).atStartOfDay(),
                        PageRequest.of(0, LIBROS_POR_FILA)).stream().map(resumen).toList());

        if (idusuario != null) {
            añadir(filas, "amigos", "Lo que leen las personas que sigues", null,
                    libroRepository.findLibrosPopularesEntreSeguidos(idusuario, PageRequest.of(0, LIBROS_POR_FILA))
                            .stream().map(resumen).toList());
            filaPersonalizada(idusuario, porCategoria).ifPresent(c -> añadir(filas, "para-ti",
                    "Porque te gusta " + c.getKey().getNombre().toLowerCase(), c.getKey().getSlug(),
                    muestra(c.getValue(), azar(hoy, idusuario, "para-ti")).stream().map(resumen).toList()));
        }

        añadir(filas, "valorados", "Los mejor valorados", null, libros.stream()
                .filter(l -> notas.containsKey(l.getIdlibro()) && notas.get(l.getIdlibro()).media() >= NOTA_MIN_VALORADOS)
                .sorted(Comparator.comparingDouble((Libro l) -> notas.get(l.getIdlibro()).media()).reversed()
                        .thenComparing(l -> -notas.get(l.getIdlibro()).total()))
                .limit(LIBROS_POR_FILA).map(resumen).toList());

        // Filas por categoría (el orden cambia cada día), intercalando clásicos y novedades
        List<Categoria> categorias = categoriasVisibles(porCategoria);
        List<Categoria> ordenDelDia = new ArrayList<>(categorias);
        Collections.shuffle(ordenDelDia, azar(hoy, idusuario, "orden"));
        for (int i = 0; i < ordenDelDia.size(); i++) {
            Categoria c = ordenDelDia.get(i);
            añadir(filas, c.getSlug(), c.getNombre(), c.getSlug(),
                    muestra(porCategoria.get(c), azar(hoy, idusuario, c.getSlug())).stream().map(resumen).toList());
            if (i == 1) añadir(filas, "clasicos", "Clásicos que no pasan de moda", null,
                    muestra(filtrar(libros, l -> l.getAnioPublicacion() != null && l.getAnioPublicacion() < ANIO_CLASICOS),
                            azar(hoy, idusuario, "clasicos")).stream().map(resumen).toList());
            if (i == 3) añadir(filas, "novedades", "Publicados recientemente", null,
                    muestra(filtrar(libros, l -> l.getAnioPublicacion() != null && l.getAnioPublicacion() >= hoy.getYear() - 3),
                            azar(hoy, idusuario, "novedades")).stream().map(resumen).toList());
        }

        return CatalogoDTO.Response.builder()
                .destacado(elegirDestacado(libros, hoy).map(l -> toResumen(l, notas, true)).orElse(null))
                .filas(filas)
                .categorias(categorias.stream().map(c -> CatalogoDTO.CategoriaInfo.builder()
                        .slug(c.getSlug()).nombre(c.getNombre()).total(porCategoria.get(c).size()).build()).toList())
                .build();
    }

    /** Todos los libros de una categoría, paginados: primero los que tienen portada y mejor nota. */
    @Transactional(readOnly = true)
    public CatalogoDTO.PaginaCategoria obtenerPorCategoria(String slug, int pagina, int tamanio) {
        Categoria categoria = Categoria.porSlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Categoría no encontrada"));
        Map<Long, Nota> notas = notasPorLibro();

        List<Libro> libros = librosSinDuplicados().stream()
                .filter(l -> Categoria.de(l.getGenero()).orElse(null) == categoria)
                .sorted(Comparator.comparing((Libro l) -> l.getPortada() == null)
                        .thenComparing(l -> -notas.getOrDefault(l.getIdlibro(), new Nota(0, 0)).media())
                        .thenComparing(Libro::getTitulo, String.CASE_INSENSITIVE_ORDER))
                .toList();

        int desde = Math.min(pagina * tamanio, libros.size());
        int hasta = Math.min(desde + tamanio, libros.size());
        return CatalogoDTO.PaginaCategoria.builder()
                .slug(categoria.getSlug())
                .nombre(categoria.getNombre())
                .total(libros.size())
                .pagina(pagina)
                .hayMas(hasta < libros.size())
                .libros(libros.subList(desde, hasta).stream().map(l -> toResumen(l, notas, false)).toList())
                .build();
    }

    // === HELPERS ===

    /** Algunos libros están importados dos veces (mismo título y autor): se queda el de menor id. */
    private List<Libro> librosSinDuplicados() {
        Map<String, Libro> unicos = new LinkedHashMap<>();
        libroRepository.findAllConAutor().stream()
                .sorted(Comparator.comparing(Libro::getIdlibro))
                .forEach(l -> unicos.putIfAbsent(
                        l.getTitulo().trim().toLowerCase() + "|" + l.getAutor().getIdautor(), l));
        return new ArrayList<>(unicos.values());
    }

    private Map<Long, Nota> notasPorLibro() {
        Map<Long, Nota> notas = new HashMap<>();
        notasLibros.todas().forEach((id, n) -> notas.put(id, new Nota(n.media(), (int) n.valoraciones())));
        return notas;
    }

    private Map<Categoria, List<Libro>> agruparPorCategoria(List<Libro> libros) {
        Map<Categoria, List<Libro>> mapa = new EnumMap<>(Categoria.class);
        libros.forEach(l -> Categoria.de(l.getGenero())
                .ifPresent(c -> mapa.computeIfAbsent(c, k -> new ArrayList<>()).add(l)));
        return mapa;
    }

    /** Categorías con libros suficientes, de más a menos libros. */
    private List<Categoria> categoriasVisibles(Map<Categoria, List<Libro>> porCategoria) {
        return porCategoria.entrySet().stream()
                .filter(e -> e.getValue().size() >= MIN_LIBROS_CATEGORIA)
                .sorted(Comparator.comparingInt((Map.Entry<Categoria, List<Libro>> e) -> e.getValue().size()).reversed())
                .map(Map.Entry::getKey)
                .toList();
    }

    /** La categoría más leída por el usuario, con los libros que aún no tiene en su estantería. */
    private Optional<Map.Entry<Categoria, List<Libro>>> filaPersonalizada(Long idusuario, Map<Categoria, List<Libro>> porCategoria) {
        Set<Long> suyos = seguimientoRepository.findByUsuarioIdusuario(idusuario).stream()
                .map(s -> s.getLibro().getIdlibro()).collect(Collectors.toSet());
        if (suyos.isEmpty()) return Optional.empty();

        return porCategoria.entrySet().stream()
                .max(Comparator.comparingLong(e -> e.getValue().stream().filter(l -> suyos.contains(l.getIdlibro())).count()))
                .filter(e -> e.getValue().stream().anyMatch(l -> suyos.contains(l.getIdlibro())))
                .map(e -> Map.entry(e.getKey(), filtrar(e.getValue(), l -> !suyos.contains(l.getIdlibro()))));
    }

    /**
     * Libro del día: uno con portada y sinopsis larga, el mismo para todos durante todo el día.
     * No depende de las notas para que una reseña nueva no lo cambie a media jornada.
     */
    private Optional<Libro> elegirDestacado(List<Libro> libros, LocalDate hoy) {
        List<Libro> candidatos = filtrar(libros, l -> l.getPortada() != null && l.getSinopsis() != null
                && l.getSinopsis().length() >= LONGITUD_MIN_SINOPSIS);
        return candidatos.isEmpty() ? Optional.empty()
                : Optional.of(candidatos.get(azar(hoy, null, "destacado").nextInt(candidatos.size())));
    }

    /**
     * Generador aleatorio que da siempre lo mismo para el mismo día, usuario y fila: el catálogo se mantiene
     * igual durante el día (aunque se entre y salga de "Ver todo") y se renueva al día siguiente.
     */
    static Random azar(LocalDate dia, Long idusuario, String clave) {
        long semilla = dia.toEpochDay();
        semilla = semilla * 31 + (idusuario != null ? idusuario : 0);
        semilla = semilla * 31 + clave.hashCode();
        return new Random(semilla);
    }

    /** Muestra aleatoria de hasta LIBROS_POR_FILA libros, con los que tienen portada primero. */
    private List<Libro> muestra(List<Libro> libros, Random random) {
        List<Libro> copia = new ArrayList<>(libros);
        Collections.shuffle(copia, random);
        copia.sort(Comparator.comparing(l -> l.getPortada() == null)); // sort estable: mantiene el orden aleatorio
        return copia.subList(0, Math.min(LIBROS_POR_FILA, copia.size()));
    }

    private static List<Libro> filtrar(List<Libro> libros, Predicate<Libro> condicion) {
        return libros.stream().filter(condicion).toList();
    }

    private static void añadir(List<CatalogoDTO.Fila> filas, String clave, String titulo, String slug,
                               List<CatalogoDTO.LibroResumen> libros) {
        if (libros.size() >= MIN_LIBROS_FILA) {
            filas.add(CatalogoDTO.Fila.builder().clave(clave).titulo(titulo).slugCategoria(slug).libros(libros).build());
        }
    }

    private CatalogoDTO.LibroResumen toResumen(Libro libro, Map<Long, Nota> notas, boolean conSinopsis) {
        Nota nota = notas.get(libro.getIdlibro());
        return CatalogoDTO.LibroResumen.builder()
                .idlibro(libro.getIdlibro())
                .titulo(libro.getTitulo())
                .portada(libro.getPortada())
                .nombreAutor(libro.getAutor().getNombre())
                .anioPublicacion(libro.getAnioPublicacion())
                .categoria(Categoria.de(libro.getGenero()).map(Categoria::getNombre).orElse(null))
                .notaMedia(nota != null ? nota.media() : null)
                .numResenas(nota != null ? nota.total() : 0)
                .sinopsis(conSinopsis ? libro.getSinopsis() : null)
                .build();
    }
}
