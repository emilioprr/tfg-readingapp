package com.readingapp.reading_app.dto;

import jakarta.validation.constraints.*;
import lombok.*;

public class AuthDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoginRequest {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es válido")
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        private String password;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuthResponse {
        private String token;
        private Long idusuario;
        private String nombre;
        private String email;
    }
}
