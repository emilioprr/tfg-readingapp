package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.ParticipanteReto;
import com.readingapp.reading_app.model.Reto;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.ModalidadReto;
import com.readingapp.reading_app.model.enums.TipoReto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/*Retos en curso contra una base de datos real (H2): los terminados y los completados no aparecen.*/
@DataJpaTest
@DisplayName("ParticipanteRetoRepository - retos en curso")
class ParticipanteRetoRepositoryTest {

    private static final LocalDate HOY = LocalDate.of(2026, 9, 29);

    @Autowired private TestEntityManager em;
    @Autowired private ParticipanteRetoRepository participanteRetoRepository;

    private Usuario ana;

    @BeforeEach
    void setUp() {
        ana = em.persist(Usuario.builder().nombre("ana").email("ana@test.com").password("x")
                .fechaAlta(LocalDate.now()).build());
    }

    private void participaEn(String titulo, LocalDate fechaFin, boolean cumplido) {
        Reto reto = em.persist(Reto.builder().titulo(titulo).tipo(TipoReto.LIBROS).modalidad(ModalidadReto.PERSONAL)
                .meta(5).fechaInicio(HOY.minusDays(30)).fechaFin(fechaFin).creador(ana).build());
        em.persist(ParticipanteReto.builder().reto(reto).usuario(ana).retoCumplido(cumplido)
                .fechaUnion(LocalDateTime.now()).build());
    }

    @Test
    @DisplayName("Solo aparecen los retos sin completar que aún no han terminado (incluido el que acaba hoy)")
    void soloRetosEnCurso() {
        participaEn("En curso", HOY.plusDays(10), false);
        participaEn("Acaba hoy", HOY, false);
        participaEn("Terminado sin conseguir", HOY.minusDays(1), false);
        participaEn("Completado", HOY.plusDays(10), true);
        em.flush();

        assertThat(participanteRetoRepository.findActivosDeUsuario(ana.getIdusuario(), HOY))
                .extracting(p -> p.getReto().getTitulo())
                .containsExactlyInAnyOrder("En curso", "Acaba hoy");
    }
}
