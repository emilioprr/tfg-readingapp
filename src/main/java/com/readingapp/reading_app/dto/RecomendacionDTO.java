package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.*;
import lombok.*;

public class RecomendacionDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private String mensaje;
        @NotNull(message = "El receptor es obligatorio")
        private Long idusuarioReceptor;
        @NotNull(message = "El emisor es obligatorio")
        private Long idusuarioEmisor;
        @NotNull(message = "El libro es obligatorio")
        private Long idlibro;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idrecomendacion;
        private String mensaje;
        private String fecha;
        private Boolean visto;
        private Boolean esAutomatica;
        private Long idusuarioEmisor;
        private String nombreEmisor;
        private Long idusuarioReceptor;
        private String nombreReceptor;
        private Long idlibro;
        private String tituloLibro;
        private String portadaLibro;
    }
}
