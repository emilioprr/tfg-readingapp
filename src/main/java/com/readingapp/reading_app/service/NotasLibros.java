package com.readingapp.reading_app.service;

import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.ValoracionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Nota media de los libros juntando las reseñas públicas y las puntuaciones sin reseña (valoraciones),
 * para que la ficha, los listados y el catálogo la calculen igual.
 */
@Component
@RequiredArgsConstructor
public class NotasLibros {

    /** Media sobre 5 (un decimal), nº total de valoraciones (reseñas + puntuaciones) y nº de reseñas públicas. */
    public record Nota(double media, long valoraciones, long resenas) {}

    private final ResenaRepository resenaRepository;
    private final ValoracionRepository valoracionRepository;

    public Map<Long, Nota> de(Collection<Long> idslibros) {
        if (idslibros.isEmpty()) return Map.of();
        return combinar(resenaRepository.findSumasNotasPorLibros(idslibros), valoracionRepository.findSumasPorLibros(idslibros));
    }

    public Map<Long, Nota> todas() {
        return combinar(resenaRepository.findSumasNotasPorLibro(), valoracionRepository.findSumasPorLibro());
    }

    /**
     * Reseñas: filas [idlibro, suma, nº con nota, nº de reseñas]. Valoraciones: filas [idlibro, suma, nº].
     */
    private Map<Long, Nota> combinar(List<Object[]> resenas, List<Object[]> valoraciones) {
        Map<Long, double[]> acumulado = new HashMap<>(); // idlibro -> {suma, nº con nota, nº de reseñas}
        for (Object[] f : resenas) {
            acumulado.put((Long) f[0], new double[]{numero(f[1]), numero(f[2]), numero(f[3])});
        }
        for (Object[] f : valoraciones) {
            double[] a = acumulado.computeIfAbsent((Long) f[0], k -> new double[3]);
            a[0] += numero(f[1]);
            a[1] += numero(f[2]);
        }
        Map<Long, Nota> notas = new HashMap<>();
        acumulado.forEach((id, a) -> {
            if (a[1] > 0) notas.put(id, new Nota(Math.round(a[0] / a[1] * 10.0) / 10.0, (long) a[1], (long) a[2]));
        });
        return notas;
    }

    private static double numero(Object o) {
        return o == null ? 0 : ((Number) o).doubleValue();
    }
}
