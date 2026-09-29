package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.DemasiadosIntentosException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("IntentosLoginService - bloqueo tras varios intentos fallidos")
class IntentosLoginServiceTest {

    private static final String EMAIL = "ana@test.com";

    /** Reloj que se puede adelantar a mano. */
    private static class RelojManual extends Clock {
        private Instant ahora = Instant.parse("2026-09-29T10:00:00Z");
        void avanzar(Duration d) { ahora = ahora.plus(d); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return ahora; }
    }

    private RelojManual reloj;
    private IntentosLoginService intentos;

    @BeforeEach
    void setUp() {
        reloj = new RelojManual();
        intentos = new IntentosLoginService(reloj);
    }

    private void fallar(int veces) {
        for (int i = 0; i < veces; i++) intentos.registrarFallo(EMAIL);
    }

    @Test
    @DisplayName("Con menos de 5 fallos se puede seguir intentando")
    void pocosFallos() {
        fallar(IntentosLoginService.MAX_FALLOS - 1);

        assertThatCode(() -> intentos.comprobar(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Al quinto fallo el email queda bloqueado")
    void bloqueoTrasCincoFallos() {
        fallar(IntentosLoginService.MAX_FALLOS);

        assertThatThrownBy(() -> intentos.comprobar(EMAIL))
                .isInstanceOf(DemasiadosIntentosException.class)
                .hasMessageContaining("15 minutos");
    }

    @Test
    @DisplayName("Pasado el bloqueo se puede volver a intentar, empezando de cero")
    void bloqueoCaduca() {
        fallar(IntentosLoginService.MAX_FALLOS);
        reloj.avanzar(IntentosLoginService.DURACION_BLOQUEO.plusSeconds(1));

        assertThatCode(() -> intentos.comprobar(EMAIL)).doesNotThrowAnyException();
        fallar(1);
        assertThatCode(() -> intentos.comprobar(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Un login correcto pone el contador a cero")
    void exitoReinicia() {
        fallar(IntentosLoginService.MAX_FALLOS - 1);
        intentos.registrarExito(EMAIL);
        fallar(IntentosLoginService.MAX_FALLOS - 1);

        assertThatCode(() -> intentos.comprobar(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("El bloqueo de un email no afecta a otros")
    void otrosEmailsNoAfectados() {
        fallar(IntentosLoginService.MAX_FALLOS);

        assertThatCode(() -> intentos.comprobar("luis@test.com")).doesNotThrowAnyException();
    }
}
