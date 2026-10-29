package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.SeguimientoDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Seguimiento;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SeguimientoService - flujo de estados de lectura")
class SeguimientoServiceTest {

    @Mock private SeguimientoRepository seguimientoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private LibroRepository libroRepository;
    @Mock private RetoService retoService;

    @InjectMocks private SeguimientoService seguimientoService;

    private Usuario usuario;
    private Libro libro;

    private static final Long ID_USUARIO = 1L;
    private static final Long ID_LIBRO = 10L;
    private static final int TOTAL_PAGINAS = 300;

    @BeforeEach
    void setUp() {
        usuario = Usuario.builder().idusuario(ID_USUARIO).nombre("ana").build();
        Autor autor = Autor.builder().nombre("Autor de prueba").build();
        libro = Libro.builder().idlibro(ID_LIBRO).titulo("Libro de prueba")
                .numPaginas(TOTAL_PAGINAS).autor(autor).build();

        lenient().when(usuarioRepository.findById(ID_USUARIO)).thenReturn(Optional.of(usuario));
        lenient().when(libroRepository.findById(ID_LIBRO)).thenReturn(Optional.of(libro));
        lenient().when(seguimientoRepository.save(any(Seguimiento.class)))
                .thenAnswer(invocacion -> invocacion.getArgument(0));
    }

    // ===== Helpers =====

    private SeguimientoDTO.CreateRequest peticion(EstadoLectura estado, Integer pagina) {
        SeguimientoDTO.CreateRequest request = new SeguimientoDTO.CreateRequest();
        request.setIdusuario(ID_USUARIO);
        request.setIdlibro(ID_LIBRO);
        request.setEstado(estado);
        request.setNumPagina(pagina);
        return request;
    }

    private void ultimoSeguimiento(EstadoLectura estado, int pagina) {
        Seguimiento anterior = Seguimiento.builder()
                .idseguimiento(99L).estado(estado).numPagina(pagina)
                .usuario(usuario).libro(libro).build();
        when(seguimientoRepository.findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(ID_USUARIO, ID_LIBRO))
                .thenReturn(Optional.of(anterior));
    }

    private void sinSeguimientoPrevio() {
        when(seguimientoRepository.findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(ID_USUARIO, ID_LIBRO))
                .thenReturn(Optional.empty());
    }

    private void librosLeyendo(long cantidad) {
        when(seguimientoRepository.countLibrosLeyendoActualmente(ID_USUARIO)).thenReturn(cantidad);
    }

    // ===== PENDIENTE (Quiero leer) =====

    @Nested
    @DisplayName("Estado PENDIENTE")
    class Pendiente {

        @Test
        @DisplayName("Se puede añadir un libro sin estado previo a 'Quiero leer'")
        void anadirSinEstadoPrevio() {
            sinSeguimientoPrevio();

            SeguimientoDTO.Response res = seguimientoService.registrar(peticion(EstadoLectura.PENDIENTE, null));

            assertThat(res.getEstado()).isEqualTo(EstadoLectura.PENDIENTE);
            assertThat(res.getNumPagina()).isZero();
            verify(seguimientoRepository).save(any(Seguimiento.class));
        }

        @Test
        @DisplayName("No se puede añadir dos veces a 'Quiero leer'")
        void noDuplicarPendiente() {
            ultimoSeguimiento(EstadoLectura.PENDIENTE, 0);

            assertThatThrownBy(() -> seguimientoService.registrar(peticion(EstadoLectura.PENDIENTE, null)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ya está en tu lista");
            verify(seguimientoRepository, never()).save(any());
        }

        @Test
        @DisplayName("No se puede añadir a 'Quiero leer' un libro que se está leyendo")
        void noPendienteSiLeyendo() {
            ultimoSeguimiento(EstadoLectura.LEYENDO, 50);

            assertThatThrownBy(() -> seguimientoService.registrar(peticion(EstadoLectura.PENDIENTE, null)))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Un libro ya leído se puede volver a añadir a 'Quiero leer' (relectura)")
        void pendienteTrasLeido() {
            ultimoSeguimiento(EstadoLectura.LEIDO, TOTAL_PAGINAS);

            SeguimientoDTO.Response res = seguimientoService.registrar(peticion(EstadoLectura.PENDIENTE, null));

            assertThat(res.getEstado()).isEqualTo(EstadoLectura.PENDIENTE);
        }
    }

    // ===== LEYENDO =====

    @Nested
    @DisplayName("Estado LEYENDO")
    class Leyendo {

        @Test
        @DisplayName("Empezar un libro sin estado previo lo deja en la página 0 y recalcula retos")
        void empezarLibroNuevo() {
            sinSeguimientoPrevio();
            librosLeyendo(0);

            SeguimientoDTO.Response res = seguimientoService.registrar(peticion(EstadoLectura.LEYENDO, null));

            assertThat(res.getEstado()).isEqualTo(EstadoLectura.LEYENDO);
            assertThat(res.getNumPagina()).isZero();
            verify(retoService).recalcularRetosActivosDeUsuario(ID_USUARIO);
        }

        @Test
        @DisplayName("Se puede empezar un libro que estaba en 'Quiero leer'")
        void empezarDesdePendiente() {
            ultimoSeguimiento(EstadoLectura.PENDIENTE, 0);
            librosLeyendo(3);

            SeguimientoDTO.Response res = seguimientoService.registrar(peticion(EstadoLectura.LEYENDO, null));

            assertThat(res.getEstado()).isEqualTo(EstadoLectura.LEYENDO);
        }

        @Test
        @DisplayName("Se puede retomar un libro abandonado")
        void retomarAbandonado() {
            ultimoSeguimiento(EstadoLectura.ABANDONADO, 120);
            librosLeyendo(2);

            SeguimientoDTO.Response res = seguimientoService.registrar(peticion(EstadoLectura.LEYENDO, null));

            assertThat(res.getEstado()).isEqualTo(EstadoLectura.LEYENDO);
        }

        @Test
        @DisplayName("No se puede empezar dos veces el mismo libro")
        void noEmpezarDosVeces() {
            ultimoSeguimiento(EstadoLectura.LEYENDO, 40);

            assertThatThrownBy(() -> seguimientoService.registrar(peticion(EstadoLectura.LEYENDO, null)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Ya estás leyendo");
        }

        @Test
        @DisplayName("Avanzar a una página mayor actualiza el progreso")
        void avanzarPagina() {
            ultimoSeguimiento(EstadoLectura.LEYENDO, 40);

            SeguimientoDTO.Response res = seguimientoService.registrar(peticion(EstadoLectura.LEYENDO, 90));

            assertThat(res.getNumPagina()).isEqualTo(90);
            assertThat(res.getPorcentaje()).isEqualTo(30.0);
        }

        @Test
        @DisplayName("No se puede registrar una página igual o menor que la anterior")
        void noRetrocederPagina() {
            ultimoSeguimiento(EstadoLectura.LEYENDO, 100);

            assertThatThrownBy(() -> seguimientoService.registrar(peticion(EstadoLectura.LEYENDO, 100)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("mayor que 100");
        }

        @Test
        @DisplayName("No se puede superar el total de páginas del libro")
        void noSuperarTotal() {
            ultimoSeguimiento(EstadoLectura.LEYENDO, 100);

            assertThatThrownBy(() -> seguimientoService.registrar(peticion(EstadoLectura.LEYENDO, TOTAL_PAGINAS + 1)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("total de páginas");
        }

        @Test
        @DisplayName("No se puede empezar un libro nuevo si ya se leen 10 a la vez")
        void limiteDiezLibros() {
            sinSeguimientoPrevio();
            librosLeyendo(10);

            assertThatThrownBy(() -> seguimientoService.registrar(peticion(EstadoLectura.LEYENDO, null)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("10 libros");
            verify(seguimientoRepository, never()).save(any());
        }

        @Test
        @DisplayName("Con 10 libros en lectura se puede seguir actualizando el progreso de uno de ellos")
        void actualizarConDiezLibros() {
            ultimoSeguimiento(EstadoLectura.LEYENDO, 50);
            lenient().when(seguimientoRepository.countLibrosLeyendoActualmente(ID_USUARIO)).thenReturn(10L);

            SeguimientoDTO.Response res = seguimientoService.registrar(peticion(EstadoLectura.LEYENDO, 80));

            assertThat(res.getNumPagina()).isEqualTo(80);
        }
    }

    // ===== LEIDO / ABANDONADO =====

    @Nested
    @DisplayName("Estados LEIDO y ABANDONADO")
    class LeidoYAbandonado {

        @Test
        @DisplayName("Terminar un libro que se está leyendo lo marca en la última página")
        void terminarLibro() {
            ultimoSeguimiento(EstadoLectura.LEYENDO, 250);

            SeguimientoDTO.Response res = seguimientoService.registrar(peticion(EstadoLectura.LEIDO, null));

            assertThat(res.getEstado()).isEqualTo(EstadoLectura.LEIDO);
            assertThat(res.getNumPagina()).isEqualTo(TOTAL_PAGINAS);
            assertThat(res.getPorcentaje()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("No se puede marcar como leído un libro que no se está leyendo")
        void noLeidoSinLeyendo() {
            sinSeguimientoPrevio();

            assertThatThrownBy(() -> seguimientoService.registrar(peticion(EstadoLectura.LEIDO, null)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Debes estar leyendo");
        }

        @Test
        @DisplayName("No se puede pasar directamente de 'Quiero leer' a leído")
        void noLeidoDesdePendiente() {
            ultimoSeguimiento(EstadoLectura.PENDIENTE, 0);

            assertThatThrownBy(() -> seguimientoService.registrar(peticion(EstadoLectura.LEIDO, null)))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Abandonar conserva la última página leída")
        void abandonarConservaPagina() {
            ultimoSeguimiento(EstadoLectura.LEYENDO, 120);

            SeguimientoDTO.Response res = seguimientoService.registrar(peticion(EstadoLectura.ABANDONADO, null));

            assertThat(res.getEstado()).isEqualTo(EstadoLectura.ABANDONADO);
            assertThat(res.getNumPagina()).isEqualTo(120);
        }

        @Test
        @DisplayName("No se puede abandonar un libro que no se está leyendo")
        void noAbandonarSinLeyendo() {
            ultimoSeguimiento(EstadoLectura.PENDIENTE, 0);

            assertThatThrownBy(() -> seguimientoService.registrar(peticion(EstadoLectura.ABANDONADO, null)))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ===== Errores y cálculo de progreso =====

    @Nested
    @DisplayName("Validaciones generales")
    class Validaciones {

        @Test
        @DisplayName("Falla si el usuario no existe")
        void usuarioInexistente() {
            SeguimientoDTO.CreateRequest request = peticion(EstadoLectura.LEYENDO, null);
            request.setIdusuario(999L);

            assertThatThrownBy(() -> seguimientoService.registrar(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Usuario");
        }

        @Test
        @DisplayName("Falla si el libro no existe")
        void libroInexistente() {
            SeguimientoDTO.CreateRequest request = peticion(EstadoLectura.LEYENDO, null);
            request.setIdlibro(999L);

            assertThatThrownBy(() -> seguimientoService.registrar(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Libro");
        }

        @Test
        @DisplayName("Si falla una validación no se recalculan los retos")
        void noRecalculaRetosSiFalla() {
            sinSeguimientoPrevio();

            assertThatThrownBy(() -> seguimientoService.registrar(peticion(EstadoLectura.LEIDO, null)))
                    .isInstanceOf(IllegalArgumentException.class);
            verify(retoService, never()).recalcularRetosActivosDeUsuario(anyLong());
        }

        @Test
        @DisplayName("Sin número de páginas del libro, el porcentaje es nulo")
        void porcentajeNuloSinPaginas() {
            libro.setNumPaginas(null);
            ultimoSeguimiento(EstadoLectura.LEYENDO, 10);

            SeguimientoDTO.Response res = seguimientoService.registrar(peticion(EstadoLectura.LEYENDO, 50));

            assertThat(res.getPorcentaje()).isNull();
        }
    }
}