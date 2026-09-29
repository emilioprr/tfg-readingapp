package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.LibroDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LibroService - ficha de detalle y listados")
class LibroServiceTest {

    @Mock private LibroRepository libroRepository;
    @Mock private AutorRepository autorRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private NotificacionService notificacionService;
    @Mock private ResenaRepository resenaRepository;
    @Mock private GoogleBooksService googleBooksService;

    @InjectMocks private LibroService libroService;

    private static final Autor AUTOR = Autor.builder().idautor(1L).nombre("Miguel Delibes").build();

    private static Libro libro(long id) {
        return Libro.builder().idlibro(id).titulo("Libro " + id).autor(AUTOR).build();
    }

    @Test
    @DisplayName("Un listado pide las notas de todos sus libros en una sola consulta")
    void listadoUnaSolaConsultaDeNotas() {
        when(libroRepository.findByAutorIdautor(eq(1L), any())).thenReturn(List.of(libro(1), libro(2), libro(3)));
        when(resenaRepository.findNotasMediasPorLibros(any())).thenReturn(List.<Object[]>of(new Object[]{2L, 4.25, 4L}));

        List<LibroDTO.Response> libros = libroService.obtenerPorAutor(1L, org.springframework.data.domain.Pageable.unpaged());

        verify(resenaRepository, times(1)).findNotasMediasPorLibros(any());
        verify(resenaRepository, never()).findNotaMediaByLibro(anyLong());
        verify(resenaRepository, never()).findDistribucionByLibro(anyLong());
        assertThat(libros).extracting(LibroDTO.Response::getNotaMedia).containsExactly(null, 4.3, null);
        assertThat(libros.get(1).getNumResenas()).isEqualTo(4);
    }

    @Test
    @DisplayName("La nota media va sobre 5, redondeada a un decimal")
    void notaSobreCinco() {
        when(libroRepository.findById(7L)).thenReturn(Optional.of(libro(7)));
        when(resenaRepository.findNotasMediasPorLibros(any())).thenReturn(List.<Object[]>of(new Object[]{7L, 3.8333, 6L}));

        LibroDTO.Response detalle = libroService.obtenerPorId(7L);

        assertThat(detalle.getNotaMedia()).isEqualTo(3.8);
    }

    @Test
    @DisplayName("La ficha de detalle incluye distribución de notas, ritmo y etiquetas")
    void detalleConEstadisticas() {
        when(libroRepository.findById(7L)).thenReturn(Optional.of(libro(7)));
        when(resenaRepository.findDistribucionByLibro(7L)).thenReturn(List.<Object[]>of(new Object[]{4.5, 2L}));
        when(resenaRepository.findRitmoMedioByLibro(7L)).thenReturn(2.0);
        when(resenaRepository.findEtiquetasPopularesByLibro(7L)).thenReturn(List.<Object[]>of(new Object[]{"ADICTIVO", 3L}));

        LibroDTO.Response detalle = libroService.obtenerPorId(7L);

        assertThat(detalle.getDistribucionNotas()).containsEntry("4.5", 2L).containsEntry("5.0", 0L);
        assertThat(detalle.getRitmoMedio()).isEqualTo(2.0);
        assertThat(detalle.getEtiquetasPopulares()).containsExactly("ADICTIVO");
    }

    @Test
    @DisplayName("Un libro sin reseñas no tiene nota y tiene 0 reseñas")
    void sinResenas() {
        when(libroRepository.findById(7L)).thenReturn(Optional.of(libro(7)));

        LibroDTO.Response detalle = libroService.obtenerPorId(7L);

        assertThat(detalle.getNotaMedia()).isNull();
        assertThat(detalle.getNumResenas()).isZero();
    }
}
