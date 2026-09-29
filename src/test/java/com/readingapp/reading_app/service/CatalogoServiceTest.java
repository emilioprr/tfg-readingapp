package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.CatalogoDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
import com.readingapp.reading_app.repository.ValoracionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CatalogoService - filas del catálogo y categorías")
class CatalogoServiceTest {

    @Mock private LibroRepository libroRepository;
    @Mock private ResenaRepository resenaRepository;
    @Mock private ValoracionRepository valoracionRepository;
    @Mock private SeguimientoRepository seguimientoRepository;

    private CatalogoService catalogoService;
    private final List<Libro> libros = new ArrayList<>();
    private long siguienteId = 1;

    private static final Autor AUTOR = Autor.builder().idautor(1L).nombre("Autora").build();

    @BeforeEach
    void setUp() {
        ZoneId zona = ZoneId.of("Europe/Madrid");
        Clock reloj = Clock.fixed(LocalDate.of(2026, 9, 28).atStartOfDay(zona).toInstant(), zona);
        catalogoService = new CatalogoService(libroRepository, new NotasLibros(resenaRepository, valoracionRepository), seguimientoRepository, reloj);

        lenient().when(libroRepository.findAllConAutor()).thenReturn(libros);
        lenient().when(resenaRepository.findSumasNotasPorLibro()).thenReturn(List.of());
        lenient().when(valoracionRepository.findSumasPorLibro()).thenReturn(List.of());
        lenient().when(libroRepository.findPopulares(any(), any())).thenReturn(List.of());
    }

    private Libro libro(String titulo, String genero, String portada) {
        Libro l = Libro.builder().idlibro(siguienteId++).titulo(titulo).genero(genero)
                .portada(portada).autor(AUTOR).build();
        libros.add(l);
        return l;
    }

    private void variosLibros(int n, String genero) {
        for (int i = 0; i < n; i++) libro(genero + " " + i, genero, "portada.jpg");
    }

    @Test
    @DisplayName("Géneros en distintos idiomas acaban en la misma fila de categoría")
    void agrupaGenerosEnUnaCategoria() {
        variosLibros(4, "Fiction");
        variosLibros(4, "Ficción");

        CatalogoDTO.Response res = catalogoService.obtenerCatalogo();

        assertThat(res.getFilas()).extracting(CatalogoDTO.Fila::getTitulo).contains("Novela");
        assertThat(res.getCategorias()).singleElement()
                .satisfies(c -> assertThat(c.getTotal()).isEqualTo(8));
    }

    @Test
    @DisplayName("Una categoría con pocos libros no tiene fila propia")
    void categoriaPequenaSinFila() {
        variosLibros(CatalogoService.MIN_LIBROS_CATEGORIA, "History");
        variosLibros(CatalogoService.MIN_LIBROS_CATEGORIA - 1, "Philosophy");

        CatalogoDTO.Response res = catalogoService.obtenerCatalogo();

        assertThat(res.getFilas()).extracting(CatalogoDTO.Fila::getSlugCategoria)
                .contains("historia").doesNotContain("filosofia");
    }

    @Test
    @DisplayName("Cada fila tiene como máximo LIBROS_POR_FILA libros")
    void limiteDeLibrosPorFila() {
        variosLibros(50, "Fiction");

        CatalogoDTO.Response res = catalogoService.obtenerCatalogo();

        assertThat(res.getFilas()).allSatisfy(f ->
                assertThat(f.getLibros()).hasSizeLessThanOrEqualTo(CatalogoService.LIBROS_POR_FILA));
    }

    @Test
    @DisplayName("Los libros importados dos veces (mismo título y autor) solo aparecen una vez")
    void sinDuplicados() {
        variosLibros(6, "History");
        libro("History 0", "History", "otra.jpg"); // duplicado del primero

        CatalogoDTO.PaginaCategoria pagina = catalogoService.obtenerPorCategoria("historia", 0, 50);

        assertThat(pagina.getTotal()).isEqualTo(6);
        assertThat(pagina.getNombre()).isEqualTo("Historia");
    }

    @Test
    @DisplayName("En la página de categoría van primero los libros con portada")
    void portadaPrimero() {
        libro("Sin portada", "History", null);
        libro("Con portada", "History", "p.jpg");

        List<CatalogoDTO.LibroResumen> contenido = catalogoService.obtenerPorCategoria("historia", 0, 10).getLibros();

        assertThat(contenido).extracting(CatalogoDTO.LibroResumen::getTitulo)
                .containsExactly("Con portada", "Sin portada");
    }

    private CatalogoService servicioEnDia(LocalDate dia) {
        ZoneId zona = ZoneId.of("Europe/Madrid");
        return new CatalogoService(libroRepository, new NotasLibros(resenaRepository, valoracionRepository), seguimientoRepository,
                Clock.fixed(dia.atTime(10, 0).atZone(zona).toInstant(), zona));
    }

    private void librosConSinopsis(int n) {
        for (int i = 0; i < n; i++) {
            libro("Novela " + i, "Fiction", "p.jpg").setSinopsis("x".repeat(200));
        }
    }

    private List<Long> idsDeFilas(CatalogoDTO.Response res) {
        return res.getFilas().stream().flatMap(f -> f.getLibros().stream()).map(CatalogoDTO.LibroResumen::getIdlibro).toList();
    }

    @Test
    @DisplayName("Durante el mismo día el catálogo no cambia entre visitas")
    void estableDuranteElDia() {
        librosConSinopsis(60);
        CatalogoService servicio = servicioEnDia(LocalDate.of(2026, 9, 28));

        CatalogoDTO.Response primera = servicio.obtenerCatalogo();
        CatalogoDTO.Response segunda = servicio.obtenerCatalogo();

        assertThat(segunda.getDestacado().getIdlibro()).isEqualTo(primera.getDestacado().getIdlibro());
        assertThat(idsDeFilas(segunda)).isEqualTo(idsDeFilas(primera));
    }

    @Test
    @DisplayName("Al día siguiente cambian el destacado y los libros de las filas")
    void cambiaAlDiaSiguiente() {
        librosConSinopsis(60);

        CatalogoDTO.Response hoy = servicioEnDia(LocalDate.of(2026, 9, 28)).obtenerCatalogo();
        CatalogoDTO.Response manana = servicioEnDia(LocalDate.of(2026, 9, 29)).obtenerCatalogo();

        assertThat(manana.getDestacado().getIdlibro()).isNotEqualTo(hoy.getDestacado().getIdlibro());
        assertThat(idsDeFilas(manana)).isNotEqualTo(idsDeFilas(hoy));
    }

    @Test
    @DisplayName("La paginación indica si quedan más libros")
    void paginacion() {
        variosLibros(10, "History");

        CatalogoDTO.PaginaCategoria primera = catalogoService.obtenerPorCategoria("historia", 0, 6);
        CatalogoDTO.PaginaCategoria segunda = catalogoService.obtenerPorCategoria("historia", 1, 6);

        assertThat(primera.getLibros()).hasSize(6);
        assertThat(primera.getHayMas()).isTrue();
        assertThat(segunda.getLibros()).hasSize(4);
        assertThat(segunda.getHayMas()).isFalse();
    }

    @Test
    @DisplayName("Una categoría inexistente da error")
    void categoriaInexistente() {
        assertThatThrownBy(() -> catalogoService.obtenerPorCategoria("no-existe", 0, 10))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
