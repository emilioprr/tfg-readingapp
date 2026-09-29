package com.readingapp.reading_app.service;

import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.ValoracionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotasLibros - nota media con reseñas y puntuaciones sin reseña")
class NotasLibrosTest {

    @Mock private ResenaRepository resenaRepository;
    @Mock private ValoracionRepository valoracionRepository;
    @InjectMocks private NotasLibros notasLibros;

    @Test
    @DisplayName("Las puntuaciones sin reseña cuentan en la media y en el total de valoraciones, no en el de reseñas")
    void combinaResenasYValoraciones() {
        // Libro 1: reseñas 4 + 5 (suma 9); valoración 3 -> media 4,0 con 3 valoraciones y 2 reseñas
        when(resenaRepository.findSumasNotasPorLibros(any())).thenReturn(List.<Object[]>of(
                new Object[]{1L, new BigDecimal("9.0"), 2L, 2L}));
        when(valoracionRepository.findSumasPorLibros(any())).thenReturn(List.<Object[]>of(
                new Object[]{1L, new BigDecimal("3.0"), 1L},
                new Object[]{2L, new BigDecimal("2.5"), 1L}));

        Map<Long, NotasLibros.Nota> notas = notasLibros.de(List.of(1L, 2L, 3L));

        assertThat(notas.get(1L)).isEqualTo(new NotasLibros.Nota(4.0, 3, 2));
        // Libro solo con una puntuación sin reseña
        assertThat(notas.get(2L)).isEqualTo(new NotasLibros.Nota(2.5, 1, 0));
        assertThat(notas).doesNotContainKey(3L);
    }

    @Test
    @DisplayName("La media va sobre 5 redondeada a un decimal")
    void redondeo() {
        when(resenaRepository.findSumasNotasPorLibros(any())).thenReturn(List.<Object[]>of(
                new Object[]{7L, new BigDecimal("23.0"), 6L, 6L}));
        when(valoracionRepository.findSumasPorLibros(any())).thenReturn(List.of());

        assertThat(notasLibros.de(List.of(7L)).get(7L).media()).isEqualTo(3.8);
    }
}
