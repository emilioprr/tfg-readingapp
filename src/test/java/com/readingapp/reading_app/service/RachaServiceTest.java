package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.RachaDTO;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.ActividadLecturaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RachaService - racha de lectura, protectores e insignias")
class RachaServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private ActividadLecturaRepository actividadLecturaRepository;

    private RachaService rachaService;
    private Usuario usuario;

    private static final Long ID_USUARIO = 1L;
    private static final ZoneId ZONA = ZoneId.of("Europe/Madrid");
    // Hoy fijo: miércoles 23/09/2026
    private static final LocalDate HOY = LocalDate.of(2026, 9, 23);

    @BeforeEach
    void setUp() {
        Clock relojFijo = Clock.fixed(HOY.atTime(12, 0).atZone(ZONA).toInstant(), ZONA);
        rachaService = new RachaService(usuarioRepository, actividadLecturaRepository, relojFijo);

        usuario = Usuario.builder()
                .idusuario(ID_USUARIO)
                .nombre("ana")
                .protectoresRacha(0)
                .mejorRacha(0)
                .diasProtegidos(new HashSet<>())
                .build();

        lenient().when(usuarioRepository.findById(ID_USUARIO)).thenReturn(Optional.of(usuario));
    }

    // ===== Helpers =====

    /** n días seguidos de actividad terminando en 'fin' (incluido). */
    private Set<LocalDate> diasSeguidos(int n, LocalDate fin) {
        Set<LocalDate> dias = new HashSet<>();
        for (int i = 0; i < n; i++) dias.add(fin.minusDays(i));
        return dias;
    }

    private void actividad(Set<LocalDate> dias) {
        when(actividadLecturaRepository.diasConActividad(eq(ID_USUARIO), any())).thenReturn(dias);
    }

    // ===== Cálculo de la racha =====

    @Nested
    @DisplayName("Cálculo de la racha")
    class Calculo {

        @Test
        @DisplayName("Sin actividad la racha es 0")
        void sinActividad() {
            actividad(Set.of());

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getRacha()).isZero();
            assertThat(res.getHoyCompletado()).isFalse();
        }

        @Test
        @DisplayName("Leer solo hoy da una racha de 1")
        void soloHoy() {
            actividad(Set.of(HOY));

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getRacha()).isEqualTo(1);
            assertThat(res.getHoyCompletado()).isTrue();
        }

        @Test
        @DisplayName("Días consecutivos terminando hoy se suman")
        void diasConsecutivos() {
            actividad(diasSeguidos(5, HOY));

            assertThat(rachaService.calcular(ID_USUARIO).getRacha()).isEqualTo(5);
        }

        @Test
        @DisplayName("Si hoy aún no se ha leído, la racha de ayer sigue viva")
        void rachaVivaSinLeerHoy() {
            actividad(diasSeguidos(3, HOY.minusDays(1)));

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getRacha()).isEqualTo(3);
            assertThat(res.getHoyCompletado()).isFalse();
        }

        @Test
        @DisplayName("Un día sin leer y sin protectores rompe la racha")
        void rachaRota() {
            actividad(diasSeguidos(4, HOY.minusDays(2)));

            assertThat(rachaService.calcular(ID_USUARIO).getRacha()).isZero();
        }

        @Test
        @DisplayName("Falla si el usuario no existe")
        void usuarioInexistente() {
            assertThatThrownBy(() -> rachaService.calcular(999L))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // ===== Protectores =====

    @Nested
    @DisplayName("Protectores de racha")
    class Protectores {

        @Test
        @DisplayName("Un protector cubre un día perdido y la racha continúa")
        void protectorCubreUnDia() {
            usuario.setProtectoresRacha(1);
            actividad(diasSeguidos(4, HOY.minusDays(2)));   // ayer no leyó

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getRacha()).isEqualTo(5);          // 4 días + ayer protegido
            assertThat(res.getProtectores()).isZero();
            assertThat(usuario.getDiasProtegidos()).contains(HOY.minusDays(1));
        }

        @Test
        @DisplayName("Si faltan más días que protectores, no se gastan y la racha se pierde")
        void protectoresInsuficientes() {
            usuario.setProtectoresRacha(1);
            actividad(diasSeguidos(3, HOY.minusDays(3)));   // faltan 2 días

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getRacha()).isZero();
            assertThat(res.getProtectores()).isEqualTo(1);
            assertThat(usuario.getDiasProtegidos()).isEmpty();
        }

        @Test
        @DisplayName("Al llegar a 7 días se gana un protector")
        void ganarProtectorA7Dias() {
            actividad(diasSeguidos(7, HOY));

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getNuevoProtector()).isTrue();
            assertThat(res.getProtectores()).isEqualTo(1);
            assertThat(usuario.getFechaUltimoProtector()).isEqualTo(HOY);
        }

        @Test
        @DisplayName("No se acumulan más de 2 protectores")
        void maximoDosProtectores() {
            usuario.setProtectoresRacha(2);
            actividad(diasSeguidos(14, HOY));

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getNuevoProtector()).isFalse();
            assertThat(res.getProtectores()).isEqualTo(2);
        }

        @Test
        @DisplayName("El protector no se concede dos veces el mismo día")
        void noDuplicarProtectorMismoDia() {
            usuario.setProtectoresRacha(1);
            usuario.setFechaUltimoProtector(HOY);
            actividad(diasSeguidos(7, HOY));

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getNuevoProtector()).isFalse();
            assertThat(res.getProtectores()).isEqualTo(1);
        }

        @Test
        @DisplayName("No se gana protector si hoy aún no se ha leído")
        void noProtectorSinLeerHoy() {
            actividad(diasSeguidos(7, HOY.minusDays(1)));

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getRacha()).isEqualTo(7);
            assertThat(res.getNuevoProtector()).isFalse();
        }
    }

    // ===== Récord e insignias =====

    @Nested
    @DisplayName("Récord e insignias")
    class RecordEInsignias {

        @Test
        @DisplayName("La mejor racha se actualiza cuando se supera")
        void actualizaRecord() {
            usuario.setMejorRacha(3);
            actividad(diasSeguidos(5, HOY));

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getMejorRacha()).isEqualTo(5);
            verify(usuarioRepository).save(usuario);
        }

        @Test
        @DisplayName("La mejor racha no baja aunque la actual sea menor")
        void recordNoBaja() {
            usuario.setMejorRacha(50);
            actividad(diasSeguidos(2, HOY));

            assertThat(rachaService.calcular(ID_USUARIO).getMejorRacha()).isEqualTo(50);
        }

        @Test
        @DisplayName("Las insignias dependen de la mejor racha y se conservan")
        void insigniasPorRecord() {
            usuario.setMejorRacha(35);
            actividad(Set.of());   // racha actual perdida

            RachaDTO.Response res = rachaService.calcular(ID_USUARIO);

            assertThat(res.getRacha()).isZero();
            assertThat(res.getInsignias()).containsExactly(7, 30);
        }

        @Test
        @DisplayName("Sin llegar a 7 días no hay insignias")
        void sinInsignias() {
            actividad(diasSeguidos(6, HOY));

            assertThat(rachaService.calcular(ID_USUARIO).getInsignias()).isEmpty();
        }
    }

    // ===== Semana =====

    @Nested
    @DisplayName("Vista semanal")
    class Semana {

        @Test
        @DisplayName("La semana va de lunes a domingo con el estado correcto de cada día")
        void estadosDeLaSemana() {
            // Lunes 21 leído, martes 22 no, miércoles 23 (hoy) aún no
            actividad(Set.of(LocalDate.of(2026, 9, 21)));

            var semana = rachaService.calcular(ID_USUARIO).getSemana();

            assertThat(semana).hasSize(7);
            assertThat(semana.get(0).getLetra()).isEqualTo("L");
            assertThat(semana.get(0).getEstado()).isEqualTo("LEIDO");
            assertThat(semana.get(1).getEstado()).isEqualTo("VACIO");
            assertThat(semana.get(2).getEstado()).isEqualTo("PENDIENTE");
            assertThat(semana.get(2).getEsHoy()).isTrue();
            assertThat(semana.get(3).getEstado()).isEqualTo("FUTURO");
            assertThat(semana.get(6).getLetra()).isEqualTo("D");
        }

        @Test
        @DisplayName("Un día cubierto por protector aparece como PROTEGIDO")
        void diaProtegidoEnSemana() {
            usuario.setProtectoresRacha(1);
            actividad(diasSeguidos(3, HOY.minusDays(2)));   // martes 22 sin leer

            var semana = rachaService.calcular(ID_USUARIO).getSemana();

            assertThat(semana.get(1).getEstado()).isEqualTo("PROTEGIDO");
        }
    }
}