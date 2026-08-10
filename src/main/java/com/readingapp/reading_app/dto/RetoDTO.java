package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.*;
import lombok.*;

public class RetoDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        @NotNull(message = "La meta de páginas es obligatoria")
        @Min(value = 1, message = "La meta debe ser al menos 1 página")
        private Integer metapaginas;
        @NotNull(message = "El usuario es obligatorio")
        private Long idusuario;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idreto;
        private Integer metapaginas;
        private String fechainicio;
        private String fechafin;
        private Boolean retoCumplido;
        private Long idusuario;
        private String nombreUsuario;
    }
}
