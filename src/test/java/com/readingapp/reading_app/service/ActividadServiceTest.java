package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.ActividadDTO;
import com.readingapp.reading_app.dto.ActividadDTO.Tipo;
import com.readingapp.reading_app.model.*;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.repository.ParticipanteRetoRepository;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ActividadService - actividad de las personas que sigues")
class ActividadServiceTest {

    @Mock private SeguimientoRepository seguimientoRepository;
    @Mock private ResenaRepository resenaRepository;
    @Mock private ParticipanteRetoRepository participanteRetoRepository;

    @InjectMocks private ActividadService actividadService;

    private final LocalDate hoy = LocalDate.now();
    private final Usuario luis = Usuario.builder().idusuario(2L).nombre("luis").build();
    private final Autor delibes = Autor.builder().idautor(5L).nombre("Miguel Delibes").build();
    private long siguienteId = 1;

    private Libro libro(String titulo) {
        return Libro.builder().idlibro(siguienteId++).titulo(titulo).autor(delibes).build();
    }

    private Seguimiento seguimiento(String titulo, EstadoLectura estado, LocalDate fecha) {
        return Seguimiento.builder().usuario(luis).libro(libro(titulo)).estado(estado).fecha(fecha).build();
    }

    private void conSeguimientos(Seguimiento... seguimientos) {
        when(seguimientoRepository.findActividadDeSeguidos(eq(1L), any(), any())).thenReturn(List.of(seguimientos));
    }

    private List<ActividadDTO.Response> feed() {
        return actividadService.obtenerDeSeguidos(1L, 0, 20).getEventos();
    }

    @Test
    @DisplayName("Cada estado se convierte en su evento: empezó, terminó o quiere leer")
    void tiposDeEvento() {
        conSeguimientos(
                seguimiento("Las ratas", EstadoLectura.LEYENDO, hoy.minusDays(2)),
                seguimiento("El camino", EstadoLectura.LEIDO, hoy.minusDays(1)),
                seguimiento("El hereje", EstadoLectura.PENDIENTE, hoy.minusDays(3)));

        List<ActividadDTO.Response> feed = feed();

        assertThat(feed).extracting(ActividadDTO.Response::getTipo)
                .containsExactly(Tipo.TERMINO, Tipo.EMPEZO, Tipo.QUIERE_LEER);
        assertThat(feed).extracting(ActividadDTO.Response::getTituloLibro)
                .containsExactly("El camino", "Las ratas", "El hereje");
        assertThat(feed.get(0).getNombreUsuario()).isEqualTo("luis");
        assertThat(feed.get(0).getNombreAutor()).isEqualTo("Miguel Delibes");
    }

    @Test
    @DisplayName("Si termina un libro y lo reseña el mismo día, la reseña sale primero")
    void resenaDelMismoDiaEncima() {
        Seguimiento terminado = seguimiento("Las ratas", EstadoLectura.LEIDO, hoy);
        conSeguimientos(terminado);
        when(resenaRepository.findResenasDeSeguidos(eq(1L), any())).thenReturn(List.of(
                Resena.builder().idresena(7L).usuario(luis).libro(terminado.getLibro())
                        .puntuacion(new BigDecimal("4")).fechaCreacion(LocalDateTime.now()).build()));

        assertThat(feed()).extracting(ActividadDTO.Response::getTipo).containsExactly(Tipo.RESENA, Tipo.TERMINO);
    }

    @Test
    @DisplayName("Las reseñas llevan su puntuación y los retos conseguidos su título")
    void datosDeResenasYRetos() {
        when(resenaRepository.findResenasDeSeguidos(eq(1L), any())).thenReturn(List.of(
                Resena.builder().idresena(7L).usuario(luis).libro(libro("Las ratas"))
                        .puntuacion(new BigDecimal("4.5")).fechaCreacion(LocalDateTime.now().minusHours(1)).build()));
        Reto reto = Reto.builder().idreto(3L).titulo("Leer 5 libros").build();
        when(participanteRetoRepository.findRetosCumplidosDeSeguidos(eq(1L), any(), any())).thenReturn(List.of(
                ParticipanteReto.builder().usuario(luis).reto(reto).retoCumplido(true)
                        .fechaCumplimiento(LocalDateTime.now().minusDays(1)).build()));

        List<ActividadDTO.Response> feed = feed();

        assertThat(feed).extracting(ActividadDTO.Response::getTipo).containsExactly(Tipo.RESENA, Tipo.RETO_CONSEGUIDO);
        assertThat(feed.get(0).getPuntuacion()).isEqualByComparingTo("4.5");
        assertThat(feed.get(0).getIdresena()).isEqualTo(7L);
        assertThat(feed.get(1).getTituloReto()).isEqualTo("Leer 5 libros");
    }

    @Test
    @DisplayName("Mezcla lecturas, reseñas y retos de la más reciente a la más antigua")
    void mezclaOrdenada() {
        conSeguimientos(seguimiento("El camino", EstadoLectura.LEIDO, hoy.minusDays(3)));
        when(resenaRepository.findResenasDeSeguidos(eq(1L), any())).thenReturn(List.of(
                Resena.builder().idresena(7L).usuario(luis).libro(libro("Las ratas"))
                        .puntuacion(new BigDecimal("4")).fechaCreacion(LocalDateTime.now().minusDays(5)).build()));
        when(participanteRetoRepository.findRetosCumplidosDeSeguidos(eq(1L), any(), any())).thenReturn(List.of(
                ParticipanteReto.builder().usuario(luis).reto(Reto.builder().idreto(3L).titulo("Reto").build())
                        .fechaCumplimiento(LocalDateTime.now().minusDays(1)).build()));

        assertThat(feed()).extracting(ActividadDTO.Response::getTipo)
                .containsExactly(Tipo.RETO_CONSEGUIDO, Tipo.TERMINO, Tipo.RESENA);
    }

    @Test
    @DisplayName("La actividad se pagina de la más reciente a la más antigua e indica si hay más")
    void paginacion() {
        List<Seguimiento> siete = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            siete.add(seguimiento("Libro " + i, EstadoLectura.LEIDO, hoy.minusDays(i * 60L)));
        }
        when(seguimientoRepository.findActividadDeSeguidos(eq(1L), any(), any())).thenReturn(siete);

        ActividadDTO.Pagina primera = actividadService.obtenerDeSeguidos(1L, 0, 5);
        ActividadDTO.Pagina segunda = actividadService.obtenerDeSeguidos(1L, 1, 5);

        assertThat(primera.getEventos()).extracting(ActividadDTO.Response::getTituloLibro)
                .containsExactly("Libro 0", "Libro 1", "Libro 2", "Libro 3", "Libro 4");
        assertThat(primera.getHayMas()).isTrue();
        assertThat(segunda.getEventos()).extracting(ActividadDTO.Response::getTituloLibro)
                .containsExactly("Libro 5", "Libro 6");
        assertThat(segunda.getHayMas()).isFalse();
    }

    @Test
    @DisplayName("Para la página N pide a cada fuente los eventos de todas las páginas hasta ella, más uno")
    void pideLosEventosNecesarios() {
        actividadService.obtenerDeSeguidos(1L, 1, 5);

        PageRequest onceEventos = PageRequest.of(0, 11); // 2 páginas de 5 + 1 para saber si hay más
        verify(seguimientoRepository).findActividadDeSeguidos(eq(1L), any(), eq(onceEventos));
        verify(resenaRepository).findResenasDeSeguidos(1L, onceEventos);
        verify(participanteRetoRepository).findRetosCumplidosDeSeguidos(eq(1L), any(), eq(onceEventos));
    }
}
