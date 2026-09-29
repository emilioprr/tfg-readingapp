package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

public class ListaDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        @NotBlank(message = "El nombre es obligatorio")
        private String nombre;
        private String descripcion;
        private Boolean esPublica = true;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private String nombre;
        private String descripcion;
        private Boolean esPublica;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idlista;
        private String nombre;
        private String descripcion;
        private Boolean esPublica;
        private String fechaCreacion;
        private Long idusuario;
        private String nombreUsuario;
        private Integer numLibros;
        private Long numLikes;
        /** Si al usuario de la sesión le gusta esta lista. */
        private Boolean likeada;
        /** Solo en "mis listas para un libro": si ese libro ya está en la lista. */
        private Boolean contieneLibro;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DetalleResponse {
        private Long idlista;
        private String nombre;
        private String descripcion;
        private Boolean esPublica;
        private String fechaCreacion;
        private Long idusuario;
        private String nombreUsuario;
        private List<LibroDTO.Response> libros;
        private Long numLikes;
        private Boolean likeada;
    }
}
