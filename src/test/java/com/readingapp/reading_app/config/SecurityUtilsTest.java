package com.readingapp.reading_app.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("SecurityUtils - comprobaciones de identidad y rol")
class SecurityUtilsTest {

    private static final Long ID_USUARIO = 1L;
    private static final Long ID_OTRO = 2L;

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    // ===== Helpers =====

    /*Simula lo que hace JwtFilter: credentials = id del usuario, authority = ROLE_<rol>.*/
    static void autenticarComo(Long idusuario, String rol) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "usuario" + idusuario + "@test.com", idusuario,
                List.of(new SimpleGrantedAuthority("ROLE_" + rol)));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Nested
    @DisplayName("esUsuarioActual")
    class EsUsuarioActual {

        @Test
        @DisplayName("true si el id coincide con el del token")
        void mismoUsuario() {
            autenticarComo(ID_USUARIO, "USER");
            assertThat(SecurityUtils.esUsuarioActual(ID_USUARIO)).isTrue();
        }

        @Test
        @DisplayName("false si el id es de otro usuario")
        void otroUsuario() {
            autenticarComo(ID_USUARIO, "USER");
            assertThat(SecurityUtils.esUsuarioActual(ID_OTRO)).isFalse();
        }

        @Test
        @DisplayName("false (sin excepción) si la petición es anónima")
        void anonimo() {
            assertThat(SecurityUtils.esUsuarioActual(ID_USUARIO)).isFalse();
        }
    }

    @Nested
    @DisplayName("esAdmin")
    class EsAdmin {

        @Test
        @DisplayName("true con rol ADMIN")
        void admin() {
            autenticarComo(ID_USUARIO, "ADMIN");
            assertThat(SecurityUtils.esAdmin()).isTrue();
        }

        @Test
        @DisplayName("false con rol USER")
        void usuarioNormal() {
            autenticarComo(ID_USUARIO, "USER");
            assertThat(SecurityUtils.esAdmin()).isFalse();
        }

        @Test
        @DisplayName("false (sin excepción) si la petición es anónima")
        void anonimo() {
            assertThat(SecurityUtils.esAdmin()).isFalse();
        }
    }

    @Nested
    @DisplayName("validarUsuario / validarAdmin / validarUsuarioOAdmin")
    class Validaciones {

        @Test
        @DisplayName("validarUsuario permite actuar sobre uno mismo")
        void validarUsuarioPropio() {
            autenticarComo(ID_USUARIO, "USER");
            assertThatCode(() -> SecurityUtils.validarUsuario(ID_USUARIO)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("validarUsuario rechaza actuar en nombre de otro")
        void validarUsuarioOtro() {
            autenticarComo(ID_USUARIO, "USER");
            assertThatThrownBy(() -> SecurityUtils.validarUsuario(ID_OTRO))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("validarAdmin rechaza a un usuario normal")
        void validarAdminUsuarioNormal() {
            autenticarComo(ID_USUARIO, "USER");
            assertThatThrownBy(SecurityUtils::validarAdmin)
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("administrador");
        }

        @Test
        @DisplayName("validarAdmin permite a un admin")
        void validarAdminAdmin() {
            autenticarComo(ID_USUARIO, "ADMIN");
            assertThatCode(SecurityUtils::validarAdmin).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("validarUsuarioOAdmin permite al propietario")
        void usuarioOAdminPropietario() {
            autenticarComo(ID_USUARIO, "USER");
            assertThatCode(() -> SecurityUtils.validarUsuarioOAdmin(ID_USUARIO)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("validarUsuarioOAdmin permite a un admin sobre otro usuario")
        void usuarioOAdminAdmin() {
            autenticarComo(ID_USUARIO, "ADMIN");
            assertThatCode(() -> SecurityUtils.validarUsuarioOAdmin(ID_OTRO)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("validarUsuarioOAdmin rechaza a otro usuario normal")
        void usuarioOAdminOtro() {
            autenticarComo(ID_USUARIO, "USER");
            assertThatThrownBy(() -> SecurityUtils.validarUsuarioOAdmin(ID_OTRO))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
