package com.readingapp.reading_app.config;

import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    /**
     * Obtiene el ID del usuario autenticado desde el token JWT.
     */
    public static Long getUsuarioAutenticadoId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication().getCredentials();
    }

    /**
     * Lanza excepción si el idusuario no coincide con el del token.
     * Usar en controllers donde el usuario actúa sobre sus propios datos.
     */
    public static void validarUsuario(Long idusuario) {
        Long tokenId = getUsuarioAutenticadoId();
        if (!tokenId.equals(idusuario)) {
            throw new IllegalArgumentException("No tienes permiso para actuar en nombre de otro usuario");
        }
    }
}
