package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.ValoracionDTO;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Seguimiento;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.Valoracion;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import com.readingapp.reading_app.repository.ValoracionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ValoracionService - puntuar sin reseña y lecturas antiguas")
class ValoracionServiceTest {

    @Mock private ValoracionRepository valoracionRepository;
    @Mock private ResenaRepository resenaRepository;
    @Mock private SeguimientoRepository seguimientoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private LibroRepository libroRepository;

    @InjectMocks private ValoracionService valoracionService;

    private Usuario ana;
    private Libro libro;

    @BeforeEach
    void setUp() {
        ana = Usuario.builder().idusuario(1L).nombre("ana").build();
        libro = Libro.builder().idlibro(10L).titulo("Primera memoria").numPaginas(250).build();
        lenient().when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));
        lenient().when(libroRepository.findById(10L)).thenReturn(Optional.of(libro));
        lenient().when(valoracionRepository.save(any(Valoracion.class))).thenAnswer(inv -> inv.getArgument(0));
        // Ana es quien usa la aplicación en estos tests
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "ana@test.com", 1L, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    /** El último seguimiento de Ana para el libro (null = nunca lo ha tenido en la estantería). */
    private void ultimoSeguimiento(EstadoLectura estado, boolean lecturaAntigua) {
        Seguimiento s = estado == null ? null : Seguimiento.builder().usuario(ana).libro(libro).estado(estado)
                .numPagina(estado == EstadoLectura.LEIDO ? 250 : 20).lecturaAntigua(lecturaAntigua).build();
        when(seguimientoRepository.findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(1L, 10L))
                .thenReturn(Optional.ofNullable(s));
    }

    @Test
    @DisplayName("Puntuar un libro no leído lo marca como leído hace tiempo (lectura antigua, sin páginas)")
    void puntuarMarcaLecturaAntigua() {
        ultimoSeguimiento(null, false);

        ValoracionDTO.Response res = valoracionService.valorar(10L, new BigDecimal("4.5"));

        ArgumentCaptor<Seguimiento> guardado = ArgumentCaptor.forClass(Seguimiento.class);
        verify(seguimientoRepository).save(guardado.capture());
        assertThat(guardado.getValue().getEstado()).isEqualTo(EstadoLectura.LEIDO);
        assertThat(guardado.getValue().getLecturaAntigua()).isTrue();
        assertThat(guardado.getValue().getNumPagina()).isZero();
        assertThat(res.getPuntuacion()).isEqualByComparingTo("4.5");
    }

    @Test
    @DisplayName("Si ya estaba leído, puntuar no crea otra lectura")
    void yaLeidoNoCreaLectura() {
        ultimoSeguimiento(EstadoLectura.LEIDO, false);

        valoracionService.valorar(10L, new BigDecimal("3"));

        verify(seguimientoRepository, never()).save(any());
        verify(valoracionRepository).save(any(Valoracion.class));
    }

    @Test
    @DisplayName("Volver a puntuar cambia la nota de la valoración que ya existía")
    void cambiarNota() {
        ultimoSeguimiento(EstadoLectura.LEIDO, false);
        Valoracion existente = Valoracion.builder().usuario(ana).libro(libro).puntuacion(new BigDecimal("3")).build();
        when(valoracionRepository.findByUsuarioIdusuarioAndLibroIdlibro(1L, 10L)).thenReturn(Optional.of(existente));

        valoracionService.valorar(10L, new BigDecimal("4"));

        verify(valoracionRepository).save(existente);
        assertThat(existente.getPuntuacion()).isEqualByComparingTo("4");
    }

    @Test
    @DisplayName("No se puede puntuar un libro mientras se está leyendo")
    void noMientrasLeyendo() {
        ultimoSeguimiento(EstadoLectura.LEYENDO, false);

        assertThatThrownBy(() -> valoracionService.valorar(10L, new BigDecimal("4")))
                .isInstanceOf(IllegalArgumentException.class);
        verify(valoracionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Si ya tiene reseña, la nota se cambia desde la reseña")
    void noSiYaTieneResena() {
        when(resenaRepository.countByUsuarioIdusuarioAndLibroIdlibro(1L, 10L)).thenReturn(1L);

        assertThatThrownBy(() -> valoracionService.valorar(10L, new BigDecimal("4")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("reseña");
        verify(valoracionRepository, never()).save(any());
    }

    @Test
    @DisplayName("La nota debe ir de media en media estrella")
    void soloMediasEstrellas() {
        assertThatThrownBy(() -> valoracionService.valorar(10L, new BigDecimal("3.3")))
                .isInstanceOf(IllegalArgumentException.class);
        verify(valoracionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Quitar la puntuación deshace la lectura antigua que había creado")
    void quitarDeshaceLecturaAntigua() {
        ultimoSeguimiento(EstadoLectura.LEIDO, true);

        valoracionService.quitar(10L);

        verify(valoracionRepository).borrar(1L, 10L);
        verify(seguimientoRepository).delete(any(Seguimiento.class));
    }

    @Test
    @DisplayName("Quitar la puntuación de un libro leído de verdad no toca su lectura")
    void quitarNoTocaLecturaNormal() {
        ultimoSeguimiento(EstadoLectura.LEIDO, false);

        valoracionService.quitar(10L);

        verify(valoracionRepository).borrar(1L, 10L);
        verify(seguimientoRepository, never()).delete(any());
    }
}
