package com.readingapp.reading_app.service;

import com.readingapp.reading_app.model.*;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.repository.ActividadLecturaRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
import com.readingapp.reading_app.repository.ValoracionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/*Puntuar un libro desde su ficha sin reseña, contra una base de datos real (H2).*/
@DataJpaTest
@Import({ValoracionService.class, ActividadLecturaRepository.class})
@DisplayName("ValoracionService - puntuar sin reseña y lecturas antiguas")
class ValoracionServiceTest {

    @Autowired private TestEntityManager em;
    @Autowired private ValoracionService valoracionService;
    @Autowired private ValoracionRepository valoracionRepository;
    @Autowired private SeguimientoRepository seguimientoRepository;
    @Autowired private ActividadLecturaRepository actividadLecturaRepository;

    private Usuario ana;
    private Libro libro;

    @BeforeEach
    void setUp() {
        ana = em.persist(Usuario.builder().nombre("ana").email("ana@test.com").password("x")
                .fechaAlta(LocalDate.now()).seguidos(new HashSet<>()).build());
        Autor autor = em.persist(Autor.builder().nombre("Ana María Matute").seguidores(0).build());
        libro = em.persist(Libro.builder().titulo("Primera memoria").numPaginas(250).autor(autor).build());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "ana@test.com", ana.getIdusuario(), List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    private void seguimiento(EstadoLectura estado, int pagina) {
        em.persist(Seguimiento.builder().usuario(ana).libro(libro).estado(estado).numPagina(pagina)
                .fecha(LocalDate.now()).build());
        em.flush();
    }

    private Seguimiento ultimo() {
        return seguimientoRepository.findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(
                ana.getIdusuario(), libro.getIdlibro()).orElseThrow();
    }

    @Test
    @DisplayName("Puntuar un libro no leído lo marca como leído hace tiempo, sin contar para retos, racha ni páginas")
    void puntuarMarcaLecturaAntigua() {
        valoracionService.valorar(libro.getIdlibro(), new BigDecimal("4.5"));
        em.flush();

        Seguimiento s = ultimo();
        assertThat(s.getEstado()).isEqualTo(EstadoLectura.LEIDO);
        assertThat(s.getLecturaAntigua()).isTrue();
        // Cuenta como libro leído...
        assertThat(seguimientoRepository.countByUsuarioIdusuarioAndEstado(ana.getIdusuario(), EstadoLectura.LEIDO)).isEqualTo(1);
        // ...pero no para los retos de libros, ni la racha, ni las páginas
        LocalDate hoy = LocalDate.now();
        assertThat(seguimientoRepository.countByUsuarioIdusuarioAndEstadoAndFechaBetween(
                ana.getIdusuario(), EstadoLectura.LEIDO, hoy.minusDays(1), hoy.plusDays(1))).isZero();
        assertThat(actividadLecturaRepository.diasConActividad(ana.getIdusuario(), hoy.minusDays(1))).isEmpty();
        assertThat(seguimientoRepository.sumPaginasByUsuario(ana.getIdusuario())).isZero();
    }

    @Test
    @DisplayName("Una lectura normal terminada sí cuenta para retos y racha")
    void lecturaNormalSiCuenta() {
        seguimiento(EstadoLectura.LEIDO, 250);
        LocalDate hoy = LocalDate.now();

        assertThat(seguimientoRepository.countByUsuarioIdusuarioAndEstadoAndFechaBetween(
                ana.getIdusuario(), EstadoLectura.LEIDO, hoy.minusDays(1), hoy.plusDays(1))).isEqualTo(1);
        assertThat(actividadLecturaRepository.diasConActividad(ana.getIdusuario(), hoy.minusDays(1))).containsExactly(hoy);
    }

    @Test
    @DisplayName("Si ya estaba leído, puntuar no crea otra lectura; volver a puntuar cambia la nota")
    void yaLeidoYCambiarNota() {
        seguimiento(EstadoLectura.LEIDO, 250);

        valoracionService.valorar(libro.getIdlibro(), new BigDecimal("3"));
        valoracionService.valorar(libro.getIdlibro(), new BigDecimal("4"));
        em.flush();

        assertThat(seguimientoRepository.countByUsuarioIdusuarioAndEstado(ana.getIdusuario(), EstadoLectura.LEIDO)).isEqualTo(1);
        assertThat(valoracionService.obtenerMia(libro.getIdlibro()).orElseThrow().getPuntuacion()).isEqualByComparingTo("4");
        assertThat(valoracionRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Quitar la puntuación deshace la lectura antigua que había creado")
    void quitarDeshace() {
        valoracionService.valorar(libro.getIdlibro(), new BigDecimal("2"));
        em.flush();

        valoracionService.quitar(libro.getIdlibro());
        em.flush();

        assertThat(valoracionService.obtenerMia(libro.getIdlibro())).isEmpty();
        assertThat(seguimientoRepository.findTopByUsuarioIdusuarioAndLibroIdlibroOrderByIdseguimientoDesc(
                ana.getIdusuario(), libro.getIdlibro())).isEmpty();
    }

    @Test
    @DisplayName("Quitar la puntuación de un libro leído de verdad no toca su lectura")
    void quitarNoTocaLecturaNormal() {
        seguimiento(EstadoLectura.LEIDO, 250);
        valoracionService.valorar(libro.getIdlibro(), new BigDecimal("5"));
        em.flush();

        valoracionService.quitar(libro.getIdlibro());
        em.flush();

        assertThat(ultimo().getLecturaAntigua()).isFalse();
    }

    @Test
    @DisplayName("No se puede puntuar mientras se lee, si ya tiene reseña, ni con notas fuera de medias estrellas")
    void restricciones() {
        seguimiento(EstadoLectura.LEYENDO, 20);
        assertThatThrownBy(() -> valoracionService.valorar(libro.getIdlibro(), new BigDecimal("4")))
                .isInstanceOf(IllegalArgumentException.class);

        seguimiento(EstadoLectura.LEIDO, 250);
        assertThatThrownBy(() -> valoracionService.valorar(libro.getIdlibro(), new BigDecimal("3.3")))
                .isInstanceOf(IllegalArgumentException.class);

        em.persist(Resena.builder().usuario(ana).libro(libro).puntuacion(new BigDecimal("4")).texto("Muy bueno")
                .esPublica(true).tieneSpoiler(false).leidopreviamente(false).fechaCreacion(LocalDateTime.now())
                .etiquetas(new HashSet<>()).build());
        em.flush();
        assertThatThrownBy(() -> valoracionService.valorar(libro.getIdlibro(), new BigDecimal("4")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
