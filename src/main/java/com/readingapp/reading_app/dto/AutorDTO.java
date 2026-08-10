package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.*;
import lombok.*;

public class AutorDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        @NotBlank(message = "El nombre es obligatorio")
        private String nombre;
        private String biografia;
        private String foto;
        private String nacionalidad;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idautor;
        private String nombre;
        private String biografia;
        private String foto;
        private String nacionalidad;
        private Integer seguidores;
        private Integer numLibros;
    }
}
