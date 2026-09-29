package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.RecomendacionDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Recomendacion;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.RecomendacionRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecomendacionService - recomendar solo entre mutuals")
class RecomendacionServiceTest {

    @Mock private RecomendacionRepository recomendacionRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private LibroRepository libroRepository;
    @Mock private NotificacionService notificacionService;

    @InjectMocks private RecomendacionService recomendacionService;

    private Usuario ana;
    private Usuario luis;

    private static Usuario usuario(Long id, String nombre) {
        return Usuario.builder().idusuario(id).nombre(nombre).seguidos(new HashSet<>()).build();
    }

    @BeforeEach
    void setUp() {
        ana = usuario(1L, "ana");
        luis = usuario(2L, "luis");
        Libro libro = Libro.builder().idlibro(10L).titulo("Las ratas")
                .autor(Autor.builder().idautor(5L).nombre("Miguel Delibes").build()).build();
        lenient().when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));
        lenient().when(usuarioRepository.findById(2L)).thenReturn(Optional.of(luis));
        lenient().when(libroRepository.findById(10L)).thenReturn(Optional.of(libro));
        lenient().when(recomendacionRepository.save(any(Recomendacion.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private RecomendacionDTO.CreateRequest deAnaALuis() {
        RecomendacionDTO.CreateRequest r = new RecomendacionDTO.CreateRequest();
        r.setIdusuarioEmisor(1L);
        r.setIdusuarioReceptor(2L);
        r.setIdlibro(10L);
        r.setMensaje("Te va a encantar");
        return r;
    }

    @Test
    @DisplayName("Si os seguís mutuamente, la recomendación se envía y avisa al receptor")
    void mutualsPuedenRecomendar() {
        ana.getSeguidos().add(luis);
        luis.getSeguidos().add(ana);

        RecomendacionDTO.Response res = recomendacionService.crear(deAnaALuis());

        assertThat(res.getTituloLibro()).isEqualTo("Las ratas");
        verify(notificacionService).crearNotificacionRecomendacion(any(Recomendacion.class));
    }

    @Test
    @DisplayName("Si solo le sigues tú, no puedes recomendarle")
    void soloLeSigues() {
        ana.getSeguidos().add(luis);

        assertThatThrownBy(() -> recomendacionService.crear(deAnaALuis()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mutuamente");
        verify(recomendacionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Si solo te sigue él, tampoco")
    void soloTeSigue() {
        luis.getSeguidos().add(ana);

        assertThatThrownBy(() -> recomendacionService.crear(deAnaALuis()))
                .isInstanceOf(IllegalArgumentException.class);
        verify(notificacionService, never()).crearNotificacionRecomendacion(any());
    }

    @Test
    @DisplayName("Nadie puede recomendarse un libro a sí mismo")
    void aSiMismo() {
        RecomendacionDTO.CreateRequest r = deAnaALuis();
        r.setIdusuarioReceptor(1L);

        assertThatThrownBy(() -> recomendacionService.crear(r))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
