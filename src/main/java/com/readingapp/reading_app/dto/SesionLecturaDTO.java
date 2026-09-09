package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.*;
import lombok.*;

public class SesionLecturaDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        @NotNull(message = "El usuario es obligatorio")
        private Long idusuario;
        private Long idlibro;
        @NotNull @Min(1)
        private Integer duracionMinutos;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idsesion;
        private Long idusuario;
        private String nombreUsuario;
        private Long idlibro;
        private String tituloLibro;
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