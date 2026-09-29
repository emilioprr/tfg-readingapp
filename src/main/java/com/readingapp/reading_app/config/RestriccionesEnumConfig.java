package com.readingapp.reading_app.config;

import com.readingapp.reading_app.model.enums.TipoNotificacion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Hibernate crea en Postgres un CHECK con los valores del enum (notificacion_tipo_check), pero
 * ddl-auto=update no lo actualiza cuando se añade un tipo nuevo y las inserciones fallarían.
 * Al arrancar se vuelve a crear a partir del enum actual.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RestriccionesEnumConfig {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void sincronizarTiposNotificacion() {
        String valores = Arrays.stream(TipoNotificacion.values())
                .map(t -> "'" + t.name() + "'")
                .collect(Collectors.joining(", "));
        try {
            jdbcTemplate.execute("ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_tipo_check");
            jdbcTemplate.execute("ALTER TABLE notificacion ADD CONSTRAINT notificacion_tipo_check CHECK (tipo IN (" + valores + "))");
        } catch (Exception e) {
            log.warn("No se pudo actualizar la restricción de tipos de notificación: {}", e.getMessage());
        }
    }
}
