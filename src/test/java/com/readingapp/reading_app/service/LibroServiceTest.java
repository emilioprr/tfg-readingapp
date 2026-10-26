package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.LibroDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import com.readingapp.reading_app.repository.ValoracionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    @Mock private ValoracionRepository valoracionRepository;
    @Mock private NotasLibros notasLibros;

    @InjectMocks private LibroService libroService;

    private static final Autor AUTOR = Autor.builder().idautor(1L).nombre("Miguel Delibes").build();

    private static Libro libro(long id) {
        return Libro.builder().idlibro(id).titulo("Libro " + id).autor(AUTOR).build();
    }

    @Test
    @DisplayName("Un listado pide las notas de todos sus libros en una sola consulta")
    void listadoUnaSolaConsultaDeNotas() {
        when(libroRepository.findByAutorIdautor(eq(1L), any())).thenReturn(List.of(libro(1), libro(2), libro(3)));
        when(notasLibros.de(any())).thenReturn(Map.of(2L, new NotasLibros.Nota(4.3, 6, 4)));

        List<LibroDTO.Response> libros = libroService.obtenerPorAutor(1L, org.springframework.data.domain.Pageable.unpaged());

        verify(notasLibros, times(1)).de(any());
        verify(resenaRepository, never()).findNotaMediaByLibro(anyLong());
        verify(resenaRepository, never()).findDistribucionByLibro(anyLong());
        assertThat(libros).extracting(LibroDTO.Response::getNotaMedia).containsExactly(null, 4.3, null);
        assertThat(libros.get(1).getNumResenas()).isEqualTo(4);
        assertThat(libros.get(1).getNumValoraciones()).isEqualTo(6);
    }

    @Test
    @DisplayName("La ficha de detalle incluye distribución de notas, ritmo y etiquetas")
    void detalleConEstadisticas() {
        when(libroRepository.findById(7L)).thenReturn(Optional.of(libro(7)));
        when(resenaRepository.findDistribucionByLibro(7L)).thenReturn(List.<Object[]>of(new Object[]{4.5, 2L}));
        // Las puntuaciones sin reseña se suman en la misma barra
        when(valoracionRepository.findDistribucionByLibro(7L)).thenReturn(List.<Object[]>of(new Object[]{4.5, 1L}, new Object[]{3.0, 1L}));
        when(resenaRepository.findRitmoMedioByLibro(7L)).thenReturn(2.0);
        when(resenaRepository.findEtiquetasPopularesByLibro(7L)).thenReturn(List.<Object[]>of(new Object[]{"ADICTIVO", 3L}));

        LibroDTO.Response detalle = libroService.obtenerPorId(7L);

        assertThat(detalle.getDistribucionNotas()).containsEntry("4.5", 3L).containsEntry("3.0", 1L).containsEntry("5.0", 0L);
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

    @Test
    @DisplayName("No se puede añadir un sexto favorito, pero volver a marcar uno que ya lo es no falla")
    void limiteDeFavoritos() {
        List<Libro> favoritos = List.of(libro(1), libro(2), libro(3), libro(4), libro(5));
        Usuario usuario = Usuario.builder().idusuario(9L).librosFavoritos(new HashSet<>(favoritos)).build();
        when(usuarioRepository.findById(9L)).thenReturn(Optional.of(usuario));
        when(libroRepository.findById(6L)).thenReturn(Optional.of(libro(6)));
        when(libroRepository.findById(1L)).thenReturn(Optional.of(favoritos.get(0)));

        assertThatThrownBy(() -> libroService.agregarFavorito(9L, 6L))
                .isInstanceOf(IllegalArgumentException.class);
        libroService.agregarFavorito(9L, 1L);

        assertThat(usuario.getLibrosFavoritos()).hasSize(LibroService.MAX_FAVORITOS);
    }
}
