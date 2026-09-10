package com.readingapp.reading_app.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    /*Obtiene el ID del usuario autenticado desde el token JWT.*/
    public static Long getUsuarioAutenticadoId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication().getCredentials();
    }

    /*Lanza excepción si el idusuario no coincide con el del token.*/
    public static void validarUsuario(Long idusuario) {
        Long tokenId = getUsuarioAutenticadoId();
        if (!tokenId.equals(idusuario)) {
            throw new IllegalArgumentException("No tienes permiso para actuar en nombre de otro usuario");
        }
    }

    public static void validarAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new IllegalArgumentException("Se requieren permisos de administrador");
        }
    }

    public static void validarUsuarioOAdmin(Long idusuario) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;

        Long tokenId = getUsuarioAutenticadoId();
        if (!tokenId.equals(idusuario)) {
            throw new IllegalArgumentException("No tienes permiso para realizar esta acción");
        }
    }
}
