package com.readingapp.reading_app.dto;

import com.readingapp.reading_app.model.enums.EstadoLectura;
import jakarta.validation.constraints.*;
import lombok.*;

public class SeguimientoDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        @NotNull(message = "La página es obligatoria")
        private Integer numPagina;
        @NotNull(message = "El estado es obligatorio")
        private EstadoLectura estado;
        @NotNull(message = "El usuario es obligatorio")
        private Long idusuario;
        @NotNull(message = "El libro es obligatorio")
        private Long idlibro;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idseguimiento;
        private String fecha;
        private Integer numPagina;
        private EstadoLectura estado;
        private Long idusuario;
        private String nombreUsuario;
        private Long idlibro;
        private String tituloLibro;
        private Integer totalPaginas;
        private Double porcentaje;
    }
}
