package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Seguimiento;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/*Consultas de estanterías contra una base de datos real (H2 en memoria).*/
@DataJpaTest
@DisplayName("SeguimientoRepository - estanterías por estado actual")
class SeguimientoRepositoryTest {

    @Autowired private TestEntityManager em;
    @Autowired private SeguimientoRepository seguimientoRepository;

    private Usuario ana;
    private Autor autor;

    @BeforeEach
    void setUp() {
        ana = em.persist(Usuario.builder().nombre("ana").email("ana@test.com").password("x")
                .fechaAlta(LocalDate.now()).build());
        autor = em.persist(Autor.builder().nombre("Miguel Delibes").seguidores(0).build());
    }

    private Libro libro(String titulo) {
        return em.persist(Libro.builder().titulo(titulo).numPaginas(200).autor(autor).build());
    }

    private void estado(Libro libro, EstadoLectura estado, int pagina) {
        em.persist(Seguimiento.builder().usuario(ana).libro(libro).estado(estado)
                .numPagina(pagina).fecha(LocalDate.now()).build());
    }

    private List<String> titulos(EstadoLectura estado) {
        em.flush();
        return seguimientoRepository.findLibrosEnEstadoActual(ana.getIdusuario(), estado).stream()
                .map(s -> s.getLibro().getTitulo()).toList();
    }

    @Test
    @DisplayName("Un libro de \"Quiero leer\" que se empieza a leer sale de esa estantería")
    void pendienteEmpezadoSaleDeQuieroLeer() {
        Libro empezado = libro("Las ratas");
        Libro pendiente = libro("El camino");
        estado(empezado, EstadoLectura.PENDIENTE, 0);
        estado(pendiente, EstadoLectura.PENDIENTE, 0);
        estado(empezado, EstadoLectura.LEYENDO, 0);

        assertThat(titulos(EstadoLectura.PENDIENTE)).containsExactly("El camino");
        assertThat(titulos(EstadoLectura.LEYENDO)).containsExactly("Las ratas");
    }

    @Test
    @DisplayName("Un libro abandonado que se retoma sale de \"Abandonados\"")
    void abandonadoRetomadoSaleDeAbandonados() {
        Libro retomado = libro("Cinco horas con Mario");
        estado(retomado, EstadoLectura.LEYENDO, 0);
        estado(retomado, EstadoLectura.ABANDONADO, 40);
        estado(retomado, EstadoLectura.LEYENDO, 60);

        assertThat(titulos(EstadoLectura.ABANDONADO)).isEmpty();
        assertThat(titulos(EstadoLectura.LEYENDO)).containsExactly("Cinco horas con Mario");
    }

    @Test
    @DisplayName("Cada libro aparece una sola vez aunque tenga varios avances de página")
    void unaVezPorLibro() {
        Libro libro = libro("Los santos inocentes");
        estado(libro, EstadoLectura.LEYENDO, 0);
        estado(libro, EstadoLectura.LEYENDO, 50);
        estado(libro, EstadoLectura.LEYENDO, 120);

        List<Seguimiento> leyendo = seguimientoRepository.findLibrosEnEstadoActual(ana.getIdusuario(), EstadoLectura.LEYENDO);

        assertThat(leyendo).hasSize(1);
        assertThat(leyendo.get(0).getNumPagina()).isEqualTo(120);
    }

    @Test
    @DisplayName("Primero el libro con actividad más reciente")
    void masRecientePrimero() {
        Libro antiguo = libro("El hereje");
        Libro reciente = libro("La sombra del ciprés es alargada");
        estado(antiguo, EstadoLectura.PENDIENTE, 0);
        estado(reciente, EstadoLectura.PENDIENTE, 0);

        assertThat(titulos(EstadoLectura.PENDIENTE)).containsExactly("La sombra del ciprés es alargada", "El hereje");
    }
}
