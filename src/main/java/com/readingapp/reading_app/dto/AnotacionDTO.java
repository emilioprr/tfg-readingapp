package com.readingapp.reading_app.dto;

import com.readingapp.reading_app.model.enums.TipoAnotacion;
import jakarta.validation.constraints.*;
import lombok.*;

public class AnotacionDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private String texto;
        private String parte;
        @NotNull(message = "El tipo es obligatorio")
        private TipoAnotacion tipo;
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
        private String parte;
        private TipoAnotacion tipo;
        private Boolean esPublica;
        private Boolean tieneSpoiler;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idanotacion;
        private String texto;
        private String parte;
        private TipoAnotacion tipo;
        private Boolean esPublica;
        private Boolean tieneSpoiler;
        private String fecha;
        private Long idusuario;
        private String nombreUsuario;
        private Long idlibro;
        private String tituloLibro;
    }
}
