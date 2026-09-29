package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.*;
import lombok.*;

public class SesionLecturaDTO {

    /** Límite por sesión: evita registrar sesiones imposibles que completen retos de horas al instante. */
    public static final int MAX_MINUTOS_SESION = 12 * 60;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        @NotNull(message = "El usuario es obligatorio")
        private Long idusuario;
        @NotNull @Min(1)
        @Max(value = SesionLecturaDTO.MAX_MINUTOS_SESION, message = "Una sesión de lectura no puede durar más de 12 horas")
        private Integer duracionMinutos;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idsesion;
        private Long idusuario;
        private String nombreUsuario;
        private String inicio;
        private String fin;
        private Integer duracionMinutos;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ResumenResponse {
        private Long idusuario;
        private Integer totalMinutos;
        private Double totalHoras;
    }
}