package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

public class ValoracionDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class Request {
        @NotNull(message = "La puntuación es obligatoria")
        @DecimalMin(value = "0.5", message = "La puntuación mínima es 0,5")
        @DecimalMax(value = "5.0", message = "La puntuación máxima es 5")
        private BigDecimal puntuacion;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idlibro;
        private BigDecimal puntuacion;
        private String fecha;
    }
}
