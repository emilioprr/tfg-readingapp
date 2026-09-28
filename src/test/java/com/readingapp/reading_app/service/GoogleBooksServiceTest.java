package com.readingapp.reading_app.service;

import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GoogleBooksService - búsqueda con caché")
class GoogleBooksServiceTest {

    @Mock private RestTemplate restTemplate;
    @Mock private AutorRepository autorRepository;
    @Mock private LibroRepository libroRepository;
    @Mock private OpenLibraryService openLibraryService;

    @InjectMocks private GoogleBooksService googleBooksService;

    private static Map<String, Object> respuesta(String... titulos) {
        List<Map<String, Object>> items = java.util.Arrays.stream(titulos)
                .map(t -> Map.<String, Object>of("id", "id-" + t,
                        "volumeInfo", Map.of("title", t, "authors", List.of("Miguel Delibes"))))
                .toList();
        return Map.of("items", items);
    }

    private int llamadasAGoogle() {
        return mockingDetails(restTemplate).getInvocations().size();
    }

    @BeforeEach
    void setUp() {
        lenient().when(libroRepository.findFirstByIdapiexterna(any())).thenReturn(java.util.Optional.empty());
        lenient().when(libroRepository.buscarPorTituloYAutorNormalizado(any(), any())).thenReturn(java.util.Optional.empty());
    }

    @Test
    @DisplayName("Repetir la misma búsqueda no vuelve a llamar a Google")
    void busquedaRepetidaUsaCache() {
        when(restTemplate.getForObject(anyString(), eq(Map.class), any(), anyInt(), any()))
                .thenReturn(respuesta("Las ratas", "El camino"));

        Map<String, Object> primera = googleBooksService.buscarEnGoogle("las ratas", 0);
        int llamadas = llamadasAGoogle();
        Map<String, Object> segunda = googleBooksService.buscarEnGoogle("las ratas", 0);

        assertThat(llamadas).isPositive();
        assertThat(llamadasAGoogle()).isEqualTo(llamadas);
        assertThat(titulos(segunda)).isEqualTo(titulos(primera)).isNotEmpty();
    }

    @SuppressWarnings("unchecked")
    private static List<String> titulos(Map<String, Object> busqueda) {
        return ((List<com.readingapp.reading_app.dto.LibroDTO.BusquedaResponse>) busqueda.get("resultados")).stream()
                .map(com.readingapp.reading_app.dto.LibroDTO.BusquedaResponse::getTitulo).toList();
    }

    @Test
    @DisplayName("Las respuestas vacías no se guardan: la siguiente búsqueda vuelve a intentarlo")
    void respuestaVaciaNoSeCachea() {
        when(restTemplate.getForObject(anyString(), eq(Map.class), any(), anyInt(), any()))
                .thenReturn(Map.of());

        googleBooksService.buscarEnGoogle("nada", 0);
        int llamadas = llamadasAGoogle();
        googleBooksService.buscarEnGoogle("nada", 0);

        assertThat(llamadasAGoogle()).isEqualTo(llamadas * 2);
    }
}
