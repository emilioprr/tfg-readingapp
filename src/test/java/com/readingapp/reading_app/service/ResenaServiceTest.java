package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.ResenaDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Resena;
import com.readingapp.reading_app.model.Seguimiento;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ResenaService - reglas para escribir reseñas y likes")
class ResenaServiceTest {

    @Mock private ResenaRepository resenaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private LibroRepository libroRepository;
    @Mock private NotificacionService notificacionService;
    @Mock private SeguimientoRepository seguimientoRepository;
    @Mock private NotificacionRepository notificacionRepository;
    @Mock private ValoracionRepository valoracionRepository;

    @InjectMocks private ResenaService resenaService;

    private static final Long ID_USUARIO = 1L;
    private static final Long ID_LIBRO = 10L;

    private Usuario autor;
    private Usuario seguidor;
    private Libro libro;

    @BeforeEach
    void setUp() {
        seguidor = usuario(2L, "luis");
        autor = usuario(ID_USUARIO, "ana");
        autor.getSeguidoresList().add(seguidor);
        libro = Libro.builder().idlibro(ID_LIBRO).titulo("Las ratas")
                .autor(Autor.builder().idautor(5L).nombre("Miguel Delibes").build()).build();

        lenient().when(usuarioRepository.findById(ID_USUARIO)).thenReturn(Optional.of(autor));
        lenient().when(libroRepository.findById(ID_LIBRO)).thenReturn(Optional.of(libro));
        lenient().when(resenaRepository.save(any(Resena.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    // ===== Helpers =====

    private static Usuario usuario(Long id, String nombre) {
        return Usuario.builder().idusuario(id).nombre(nombre)
                .seguidos(new HashSet<>()).seguidoresList(new HashSet<>()).resenasLikeadas(new HashSet<>())
                .build();
    }

    private void ultimoEstado(EstadoLectura estado) {
        Seguimiento s = Seguimiento.builder().idseguimiento(99L).estado(estado).usuario(autor).libro(libro).build();
        when(seguimientoRepository.findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(ID_USUARIO, ID_LIBRO))
                .thenReturn(Optional.of(s));
    }

    /** El usuario ha terminado el libro 'lecturas' veces y ya tiene 'resenas' reseñas de él. */
    private void leidoVeces(int lecturas, int resenas) {
        ultimoEstado(EstadoLectura.LEIDO);
        when(seguimientoRepository.countByUsuarioIdusuarioAndLibroIdlibroAndEstado(ID_USUARIO, ID_LIBRO, EstadoLectura.LEIDO))
                .thenReturn((long) lecturas);
        when(resenaRepository.countByUsuarioIdusuarioAndLibroIdlibro(ID_USUARIO, ID_LIBRO)).thenReturn((long) resenas);
    }

    private ResenaDTO.CreateRequest peticion(String puntuacion) {
        return ResenaDTO.CreateRequest.builder()
                .idusuario(ID_USUARIO).idlibro(ID_LIBRO).texto("Muy buena")
                .puntuacion(puntuacion != null ? new BigDecimal(puntuacion) : null)
                .build();
    }

    private void autenticarComo(Long idusuario) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "u@test.com", idusuario, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    // ===== Crear =====

    @Nested
    @DisplayName("Escribir una reseña")
    class Crear {

        @Test
        @DisplayName("No se puede reseñar un libro que no se ha terminado")
        void sinTerminar() {
            ultimoEstado(EstadoLectura.LEYENDO);

            assertThatThrownBy(() -> resenaService.crear(peticion("4")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("terminado");
            verify(resenaRepository, never()).save(any());
        }

        @Test
        @DisplayName("No se puede reseñar un libro que nunca se ha empezado")
        void sinSeguimiento() {
            when(seguimientoRepository.findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(ID_USUARIO, ID_LIBRO))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> resenaService.crear(peticion("4")))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Una reseña por lectura: no se puede reseñar dos veces el mismo libro leído una vez")
        void unaResenaPorLectura() {
            leidoVeces(1, 1);

            assertThatThrownBy(() -> resenaService.crear(peticion("4")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("todas tus lecturas");
        }

        @Test
        @DisplayName("Una relectura permite escribir otra reseña")
        void relecturaPermiteOtraResena() {
            leidoVeces(2, 1);

            ResenaDTO.Response res = resenaService.crear(peticion("4.5"));

            assertThat(res.getPuntuacion()).isEqualByComparingTo("4.5");
        }

        @Test
        @DisplayName("La puntuación debe ir de 0,5 en 0,5")
        void puntuacionEnMediosPuntos() {
            leidoVeces(1, 0);

            assertThatThrownBy(() -> resenaService.crear(peticion("3.7")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("0.5");
        }

        @Test
        @DisplayName("Por defecto la reseña es pública, sin spoilers y sin relectura")
        void valoresPorDefecto() {
            leidoVeces(1, 0);

            ResenaDTO.Response res = resenaService.crear(peticion("4"));

            assertThat(res.getEsPublica()).isTrue();
            assertThat(res.getTieneSpoiler()).isFalse();
            assertThat(res.getLeidopreviamente()).isFalse();
        }

        @Test
        @DisplayName("Publicar una reseña no notifica a los seguidores (la ven en su feed de actividad)")
        void publicarNoNotificaSeguidores() {
            leidoVeces(1, 0);

            resenaService.crear(peticion("4"));

            verifyNoInteractions(notificacionService);
        }

        @Test
        @DisplayName("Si lo había puntuado sin reseña, esa puntuación se borra (pasa a la reseña)")
        void resenaSustituyeValoracion() {
            leidoVeces(1, 0);

            resenaService.crear(peticion("4"));

            verify(valoracionRepository).borrar(ID_USUARIO, ID_LIBRO);
        }
    }

    // ===== Editar =====

    @Nested
    @DisplayName("Editar una reseña")
    class Actualizar {

        private Resena resena;

        @BeforeEach
        void setUp() {
            resena = Resena.builder().idresena(50L).puntuacion(new BigDecimal("3")).texto("Regular")
                    .usuario(autor).libro(libro).build();
            lenient().when(resenaRepository.findById(50L)).thenReturn(Optional.of(resena));
        }

        @Test
        @DisplayName("El autor puede cambiar texto y nota; lo que no se envía no cambia")
        void actualizaSoloLoEnviado() {
            autenticarComo(ID_USUARIO);

            resenaService.actualizar(50L, ResenaDTO.UpdateRequest.builder().puntuacion(new BigDecimal("4.5")).build());

            assertThat(resena.getPuntuacion()).isEqualByComparingTo("4.5");
            assertThat(resena.getTexto()).isEqualTo("Regular");
        }

        @Test
        @DisplayName("Al editar, la nota también debe ir de 0,5 en 0,5")
        void puntuacionEnMediosPuntosAlEditar() {
            autenticarComo(ID_USUARIO);

            assertThatThrownBy(() -> resenaService.actualizar(50L,
                    ResenaDTO.UpdateRequest.builder().puntuacion(new BigDecimal("3.7")).build()))
                    .isInstanceOf(IllegalArgumentException.class);
            assertThat(resena.getPuntuacion()).isEqualByComparingTo("3");
        }

        @Test
        @DisplayName("Otro usuario no puede editar la reseña")
        void otroNoEdita() {
            autenticarComo(2L);

            assertThatThrownBy(() -> resenaService.actualizar(50L,
                    ResenaDTO.UpdateRequest.builder().texto("Hackeada").build()))
                    .isInstanceOf(AccessDeniedException.class);
            assertThat(resena.getTexto()).isEqualTo("Regular");
        }
    }

    // ===== Eliminar =====

    @Nested
    @DisplayName("Eliminar una reseña")
    class Eliminar {

        private Resena resena;

        @BeforeEach
        void setUp() {
            resena = Resena.builder().idresena(50L).puntuacion(new BigDecimal("4")).texto("Muy bueno")
                    .usuario(autor).libro(libro).likes(new HashSet<>()).etiquetas(new HashSet<>()).build();
            when(resenaRepository.findById(50L)).thenReturn(Optional.of(resena));
        }

        @Test
        @DisplayName("Si borras tu única reseña del libro, su nota se queda como puntuación sin reseña")
        void conservaLaNota() {
            autenticarComo(ID_USUARIO);
            when(resenaRepository.countByUsuarioIdusuarioAndLibroIdlibro(ID_USUARIO, ID_LIBRO)).thenReturn(1L);

            resenaService.eliminar(50L);

            verify(valoracionRepository).save(argThat(v -> v.getPuntuacion().compareTo(new BigDecimal("4")) == 0
                    && v.getUsuario() == autor && v.getLibro() == libro));
            verify(resenaRepository).deleteById(50L);
        }

        @Test
        @DisplayName("Si tienes otra reseña del libro (relectura), no se crea puntuación suelta")
        void conOtraResenaNoConserva() {
            autenticarComo(ID_USUARIO);
            when(resenaRepository.countByUsuarioIdusuarioAndLibroIdlibro(ID_USUARIO, ID_LIBRO)).thenReturn(2L);

            resenaService.eliminar(50L);

            verify(valoracionRepository, never()).save(any());
        }
    }

    // ===== Likes =====

    @Nested
    @DisplayName("Likes")
    class Likes {

        private Resena resena;

        @BeforeEach
        void setUp() {
            resena = Resena.builder().idresena(50L).usuario(autor).libro(libro).likes(new HashSet<>()).build();
            when(resenaRepository.findById(50L)).thenReturn(Optional.of(resena));
            when(usuarioRepository.findById(2L)).thenReturn(Optional.of(seguidor));
        }

        @Test
        @DisplayName("Dar like guarda el like y avisa al autor de la reseña")
        void likeNotificaAlAutor() {
            resenaService.darLike(50L, 2L);

            assertThat(seguidor.getResenasLikeadas()).contains(resena);
            verify(notificacionService).crearNotificacionLike(resena, seguidor);
        }

        @Test
        @DisplayName("Dar like dos veces no duplica el like")
        void likeDobleNoDuplica() {
            resenaService.darLike(50L, 2L);
            resenaService.darLike(50L, 2L);

            assertThat(seguidor.getResenasLikeadas()).hasSize(1);
        }

        @Test
        @DisplayName("Quitar el like lo elimina")
        void quitarLike() {
            seguidor.getResenasLikeadas().add(resena);

            resenaService.quitarLike(50L, 2L);

            assertThat(seguidor.getResenasLikeadas()).isEmpty();
        }
    }

    @Test
    @DisplayName("Las etiquetas vacías se guardan como conjunto vacío, no como null")
    void etiquetasPorDefecto() {
        leidoVeces(1, 0);
        ArgumentCaptor<Resena> guardada = ArgumentCaptor.forClass(Resena.class);

        resenaService.crear(peticion("4"));

        verify(resenaRepository).save(guardada.capture());
        assertThat(guardada.getValue().getEtiquetas()).isEqualTo(Set.of());
    }
}
