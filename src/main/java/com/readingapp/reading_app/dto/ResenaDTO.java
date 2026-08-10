package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

public class ResenaDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private String texto;
        @DecimalMin(value = "0.0") @DecimalMax(value = "10.0")
        private BigDecimal puntuacion;
        @DecimalMin(value = "0.0") @DecimalMax(value = "10.0")
        private BigDecimal puntestilo;
        @DecimalMin(value = "0.0") @DecimalMax(value = "10.0")
        private BigDecimal puntritmo;
        @DecimalMin(value = "0.0") @DecimalMax(value = "10.0")
        private BigDecimal puntpersonajes;
        private Boolean leidopreviamente;
        private Boolean esPublica;
        private Boolean tieneSpoiler;
        @NotNull(message = "El libro es obligatorio")
        private Long idlibro;
        @NotNull(message = "El usuario es obligatorio")
        private Long idusuario;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private String texto;
        private BigDecimal puntuacion;
        private BigDecimal puntestilo;
        private BigDecimal puntritmo;
        private BigDecimal puntpersonajes;
        private Boolean esPublica;
        private Boolean tieneSpoiler;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idresena;
        private String texto;
        private BigDecimal puntuacion;
        private BigDecimal puntestilo;
        private BigDecimal puntritmo;
        private BigDecimal puntpersonajes;
        private Boolean leidopreviamente;
        private Boolean esPublica;
        private Boolean tieneSpoiler;
        private String fechaCreacion;
        private Long idusuario;
        private String nombreUsuario;
        private Long idlibro;
        private String tituloLibro;
        private Integer numLikes;
    }
}
