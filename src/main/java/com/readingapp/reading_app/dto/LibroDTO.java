package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.*;
import lombok.*;

public class LibroDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        @NotBlank(message = "El título es obligatorio")
        private String titulo;
        private String idapiexterna;
        private String sinopsis;
        private Integer anioPublicacion;
        private Integer numPaginas;
        private String isbn;
        private String portada;
        private String genero;
        @NotNull(message = "El autor es obligatorio")
        private Long idautor;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private String titulo;
        private String sinopsis;
        private Integer anioPublicacion;
        private Integer numPaginas;
        private String isbn;
        private String portada;
        private String genero;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idlibro;
        private String idapiexterna;
        private String titulo;
        private String sinopsis;
        private Integer anioPublicacion;
        private Integer numPaginas;
        private String isbn;
        private String portada;
        private String genero;
        private String nombreAutor;
        private Long idautor;
    }
}
