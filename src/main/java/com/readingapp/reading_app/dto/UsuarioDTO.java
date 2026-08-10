package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.*;
import lombok.*;

public class UsuarioDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RegistroRequest {
        @NotBlank(message = "El nombre es obligatorio")
        private String nombre;

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es válido")
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        private String password;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private String nombre;
        private String biografia;
        private String avatar;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    /*Lo que la API devuelve cuando consultas un usuario.*/
    public static class Response {
        private Long idusuario;
        private String nombre;
        private String email;
        private String biografia;
        private String avatar;
        private String fechaAlta;
        private Integer seguidores;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    /*Lo que la API devuelve en la página de perfil de uno mismo.*/
    public static class PerfilResponse {
        private Long idusuario;
        private String nombre;
        private String biografia;
        private String avatar;
        private Integer seguidores;
        private Integer seguidos;
        private Integer librosLeidos;
        private Integer resenasEscritas;
    }
}
