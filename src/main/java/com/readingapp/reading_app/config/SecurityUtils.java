package com.readingapp.reading_app.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    /*Obtiene el ID del usuario autenticado desde el token JWT.*/
    public static Long getUsuarioAutenticadoId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication().getCredentials();
    }

    /*Id del usuario del token, o null si la petición es anónima.*/
    public static Long usuarioActualId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getCredentials() instanceof Long id ? id : null;
    }

    /*Devuelve true si el usuario del token es idusuario. No falla si la petición es anónima.*/
    public static boolean esUsuarioActual(Long idusuario) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getCredentials() instanceof Long id && id.equals(idusuario);
    }

    /*Devuelve true si el token tiene rol ADMIN. No falla si la petición es anónima.*/
    public static boolean esAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    /*Lanza excepción si el idusuario no coincide con el del token.*/
    public static void validarUsuario(Long idusuario) {
        Long tokenId = getUsuarioAutenticadoId();
        if (!tokenId.equals(idusuario)) {
            throw new IllegalArgumentException("No tienes permiso para actuar en nombre de otro usuario");
        }
    }

    public static void validarAdmin() {
        if (!esAdmin()) {
            throw new IllegalArgumentException("Se requieren permisos de administrador");
        }
    }

    public static void validarUsuarioOAdmin(Long idusuario) {
        if (!esAdmin()) validarUsuario(idusuario);
    }
}
