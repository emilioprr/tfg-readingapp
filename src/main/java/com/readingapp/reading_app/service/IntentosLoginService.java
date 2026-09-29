package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.DemasiadosIntentosException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Protección contra fuerza bruta en el login: tras MAX_FALLOS intentos fallidos seguidos con un mismo email,
 * ese email queda bloqueado durante DURACION_BLOQUEO. Un login correcto pone el contador a cero.
 * Se guarda en memoria: con un solo servidor es suficiente (al reiniciar se olvidan los bloqueos).
 */
@Service
@RequiredArgsConstructor
public class IntentosLoginService {

    public static final int MAX_FALLOS = 5;
    public static final Duration DURACION_BLOQUEO = Duration.ofMinutes(15);

    private final Clock clock;
    private final Map<String, Estado> intentos = new ConcurrentHashMap<>();

    private record Estado(int fallos, Instant bloqueadoHasta) {}

    /** Lanza DemasiadosIntentosException si el email está bloqueado ahora mismo. */
    public void comprobar(String email) {
        Estado estado = intentos.get(email);
        if (estado == null || estado.bloqueadoHasta() == null) return;

        Instant ahora = Instant.now(clock);
        if (ahora.isBefore(estado.bloqueadoHasta())) {
            long segundos = Duration.between(ahora, estado.bloqueadoHasta()).toSeconds();
            long minutos = Math.max(1, (segundos + 59) / 60); // redondeo hacia arriba
            throw new DemasiadosIntentosException("Demasiados intentos fallidos. Inténtalo de nuevo en "
                    + minutos + (minutos == 1 ? " minuto" : " minutos"));
        }
        intentos.remove(email); // el bloqueo ya ha pasado: se empieza de cero
    }

    public void registrarFallo(String email) {
        intentos.compute(email, (e, estado) -> {
            int fallos = (estado == null ? 0 : estado.fallos()) + 1;
            Instant bloqueo = fallos >= MAX_FALLOS ? Instant.now(clock).plus(DURACION_BLOQUEO) : null;
            return new Estado(fallos, bloqueo);
        });
    }

    public void registrarExito(String email) {
        intentos.remove(email);
    }
}
