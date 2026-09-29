package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.ActividadDTO;
import com.readingapp.reading_app.dto.ActividadDTO.Tipo;
import com.readingapp.reading_app.model.*;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.model.enums.ModalidadReto;
import com.readingapp.reading_app.model.enums.TipoReto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/*Feed de actividad contra una base de datos real (H2): qué entra y qué no.*/
@DataJpaTest
@Import(ActividadService.class)
@DisplayName("ActividadService - actividad de las personas que sigues")
class ActividadServiceTest {

    @Autowired private TestEntityManager em;
    @Autowired private ActividadService actividadService;

    private final LocalDate hoy = LocalDate.now();
    private Usuario ana, luis, carlos;
    private Autor autor;

    private Usuario usuario(String nombre) {
        return em.persist(Usuario.builder().nombre(nombre).email(nombre + "@test.com").password("x")
                .fechaAlta(hoy).seguidos(new HashSet<>()).build());
    }

    private Libro libro(String titulo) {
        return em.persist(Libro.builder().titulo(titulo).numPaginas(200).autor(autor).build());
    }

    private void seguimiento(Usuario u, Libro l, EstadoLectura estado, int pagina, LocalDate fecha) {
        em.persist(Seguimiento.builder().usuario(u).libro(l).estado(estado).numPagina(pagina).fecha(fecha).build());
    }

    @BeforeEach
    void setUp() {
        ana = usuario("ana");
        luis = usuario("luis");
        carlos = usuario("carlos"); // Ana no le sigue
        ana.getSeguidos().add(luis);
        autor = em.persist(Autor.builder().nombre("Miguel Delibes").seguidores(0).build());
    }

    private List<ActividadDTO.Response> feed() {
        em.flush();
        return actividadService.obtenerDeSeguidos(ana.getIdusuario(), 0, 20).getEventos();
    }

    @Test
    @DisplayName("Aparecen los libros empezados, terminados y en \"Quiero leer\" de quien sigues")
    void momentosDeLectura() {
        seguimiento(luis, libro("Las ratas"), EstadoLectura.LEYENDO, 0, hoy.minusDays(2));
        seguimiento(luis, libro("El camino"), EstadoLectura.LEIDO, 180, hoy.minusDays(1));
        seguimiento(luis, libro("El hereje"), EstadoLectura.PENDIENTE, 0, hoy.minusDays(3));

        assertThat(feed()).extracting(ActividadDTO.Response::getTipo, ActividadDTO.Response::getTituloLibro)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(Tipo.TERMINO, "El camino"),
                        org.assertj.core.groups.Tuple.tuple(Tipo.EMPEZO, "Las ratas"),
                        org.assertj.core.groups.Tuple.tuple(Tipo.QUIERE_LEER, "El hereje"));
    }

    @Test
    @DisplayName("Si termina un libro y lo reseña el mismo día, la reseña sale primero")
    void resenaDelMismoDiaEncima() {
        Libro libro = libro("Las ratas");
        seguimiento(luis, libro, EstadoLectura.LEIDO, 200, hoy);
        em.persist(Resena.builder().usuario(luis).libro(libro).puntuacion(new BigDecimal("4"))
                .fechaCreacion(LocalDateTime.now()).esPublica(true).build());

        assertThat(feed()).extracting(ActividadDTO.Response::getTipo).containsExactly(Tipo.RESENA, Tipo.TERMINO);
    }

    @Test
    @DisplayName("Los avances de página no llenan el feed")
    void sinAvancesDePagina() {
        Libro libro = libro("Las ratas");
        seguimiento(luis, libro, EstadoLectura.LEYENDO, 0, hoy.minusDays(2));
        seguimiento(luis, libro, EstadoLectura.LEYENDO, 50, hoy.minusDays(1));
        seguimiento(luis, libro, EstadoLectura.LEYENDO, 120, hoy);

        assertThat(feed()).hasSize(1).first().extracting(ActividadDTO.Response::getTipo).isEqualTo(Tipo.EMPEZO);
    }

    @Test
    @DisplayName("No aparece la actividad de quien no sigues")
    void soloSeguidos() {
        seguimiento(carlos, libro("Cinco horas con Mario"), EstadoLectura.LEIDO, 200, hoy);

        assertThat(feed()).isEmpty();
    }

    @Test
    @DisplayName("La actividad se pagina de la más reciente a la más antigua, sin límite de fechas")
    void paginacion() {
        for (int i = 0; i < 7; i++) {
            seguimiento(luis, libro("Libro " + i), EstadoLectura.LEIDO, 200, hoy.minusDays(i * 60L)); // hasta hace casi un año
        }
        em.flush();

        ActividadDTO.Pagina primera = actividadService.obtenerDeSeguidos(ana.getIdusuario(), 0, 5);
        ActividadDTO.Pagina segunda = actividadService.obtenerDeSeguidos(ana.getIdusuario(), 1, 5);

        assertThat(primera.getEventos()).extracting(ActividadDTO.Response::getTituloLibro)
                .containsExactly("Libro 0", "Libro 1", "Libro 2", "Libro 3", "Libro 4");
        assertThat(primera.getHayMas()).isTrue();
        assertThat(segunda.getEventos()).extracting(ActividadDTO.Response::getTituloLibro).containsExactly("Libro 5", "Libro 6");
        assertThat(segunda.getHayMas()).isFalse();
    }

    @Test
    @DisplayName("Aparecen sus reseñas públicas (no las privadas) y sus retos conseguidos")
    void resenasYRetos() {
        Libro libro = libro("Las ratas");
        em.persist(Resena.builder().usuario(luis).libro(libro).puntuacion(new BigDecimal("4.5"))
                .fechaCreacion(LocalDateTime.now().minusHours(1)).esPublica(true).build());
        em.persist(Resena.builder().usuario(luis).libro(libro).puntuacion(new BigDecimal("2"))
                .fechaCreacion(LocalDateTime.now().minusHours(2)).esPublica(false).build());
        Reto reto = em.persist(Reto.builder().titulo("Leer 5 libros").tipo(TipoReto.LIBROS)
                .modalidad(ModalidadReto.PERSONAL).meta(5).fechaInicio(hoy.minusDays(20))
                .fechaFin(hoy.plusDays(10)).creador(luis).build());
        em.persist(ParticipanteReto.builder().reto(reto).usuario(luis).retoCumplido(true)
                .fechaUnion(LocalDateTime.now().minusDays(20)).fechaCumplimiento(LocalDateTime.now().minusDays(1)).build());

        List<ActividadDTO.Response> feed = feed();

        assertThat(feed).extracting(ActividadDTO.Response::getTipo).containsExactly(Tipo.RESENA, Tipo.RETO_CONSEGUIDO);
        assertThat(feed.get(0).getPuntuacion()).isEqualByComparingTo("4.5");
        assertThat(feed.get(1).getTituloReto()).isEqualTo("Leer 5 libros");
    }
}
