package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.UsuarioDTO;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UsuarioService - registro, perfil y seguir usuarios")
class UsuarioServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private NotificacionService notificacionService;
    @Mock private SeguimientoRepository seguimientoRepository;
    @Mock private ResenaRepository resenaRepository;

    @InjectMocks private UsuarioService usuarioService;

    private static Usuario usuario(Long id, String nombre) {
        return Usuario.builder().idusuario(id).nombre(nombre).seguidores(0)
                .seguidos(new HashSet<>()).seguidoresList(new HashSet<>()).build();
    }

    @BeforeEach
    void setUp() {
        lenient().when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Nested
    @DisplayName("Registro")
    class Registro {

        private UsuarioDTO.RegistroRequest peticion(String nombre, String email) {
            UsuarioDTO.RegistroRequest r = new UsuarioDTO.RegistroRequest();
            r.setNombre(nombre);
            r.setEmail(email);
            r.setPassword("secreta123");
            return r;
        }

        @Test
        @DisplayName("Guarda la contraseña cifrada, nunca en claro")
        void contrasenaCifrada() {
            when(passwordEncoder.encode("secreta123")).thenReturn("$2a$hash");
            ArgumentCaptor<Usuario> guardado = ArgumentCaptor.forClass(Usuario.class);

            usuarioService.registrar(peticion("ana", "ana@test.com"));

            verify(usuarioRepository).save(guardado.capture());
            assertThat(guardado.getValue().getPassword()).isEqualTo("$2a$hash");
            assertThat(guardado.getValue().getSeguidores()).isZero();
        }

        @Test
        @DisplayName("El nombre de usuario no puede tener espacios")
        void nombreSinEspacios() {
            assertThatThrownBy(() -> usuarioService.registrar(peticion("ana garcia", "ana@test.com")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("espacios");
            verify(usuarioRepository, never()).save(any());
        }

        @Test
        @DisplayName("No puede haber dos usuarios con el mismo nombre")
        void nombreRepetido() {
            when(usuarioRepository.existsByNombre("ana")).thenReturn(true);

            assertThatThrownBy(() -> usuarioService.registrar(peticion("ana", "otra@test.com")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("nombre");
        }

        @Test
        @DisplayName("No puede haber dos usuarios con el mismo email")
        void emailRepetido() {
            when(usuarioRepository.existsByEmail("ana@test.com")).thenReturn(true);

            assertThatThrownBy(() -> usuarioService.registrar(peticion("ana2", "ana@test.com")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("email");
        }
    }

    @Nested
    @DisplayName("Editar perfil")
    class Actualizar {

        private Usuario ana;

        @BeforeEach
        void setUp() {
            ana = usuario(1L, "ana");
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));
        }

        @Test
        @DisplayName("Mantener el mismo nombre no cuenta como repetido")
        void mismoNombre() {
            UsuarioDTO.UpdateRequest r = new UsuarioDTO.UpdateRequest();
            r.setNombre("ana");
            r.setBiografia("Me gusta leer");

            usuarioService.actualizar(1L, r);

            assertThat(ana.getBiografia()).isEqualTo("Me gusta leer");
            verify(usuarioRepository, never()).existsByNombre(any());
        }

        @Test
        @DisplayName("No se puede cambiar a un nombre que ya usa otra persona")
        void nombreDeOtro() {
            when(usuarioRepository.existsByNombre("luis")).thenReturn(true);
            UsuarioDTO.UpdateRequest r = new UsuarioDTO.UpdateRequest();
            r.setNombre("luis");

            assertThatThrownBy(() -> usuarioService.actualizar(1L, r))
                    .isInstanceOf(IllegalArgumentException.class);
            assertThat(ana.getNombre()).isEqualTo("ana");
        }
    }

    @Nested
    @DisplayName("Seguir y dejar de seguir")
    class Seguir {

        private Usuario ana;
        private Usuario luis;

        @BeforeEach
        void setUp() {
            ana = usuario(1L, "ana");
            luis = usuario(2L, "luis");
            lenient().when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));
            lenient().when(usuarioRepository.findById(2L)).thenReturn(Optional.of(luis));
        }

        @Test
        @DisplayName("Seguir a alguien suma un seguidor y le avisa")
        void seguirSumaYNotifica() {
            usuarioService.seguirUsuario(1L, 2L);

            assertThat(ana.getSeguidos()).contains(luis);
            assertThat(luis.getSeguidores()).isEqualTo(1);
            verify(notificacionService).crearNotificacionSeguidor(luis, ana);
        }

        @Test
        @DisplayName("Nadie puede seguirse a sí mismo")
        void noSeguirseASiMismo() {
            assertThatThrownBy(() -> usuarioService.seguirUsuario(1L, 1L))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("No se puede seguir dos veces a la misma persona")
        void noSeguirDosVeces() {
            ana.getSeguidos().add(luis);
            luis.setSeguidores(1);

            assertThatThrownBy(() -> usuarioService.seguirUsuario(1L, 2L))
                    .isInstanceOf(IllegalArgumentException.class);
            assertThat(luis.getSeguidores()).isEqualTo(1);
        }

        @Test
        @DisplayName("Dejar de seguir resta un seguidor")
        void dejarDeSeguir() {
            ana.getSeguidos().add(luis);
            luis.setSeguidores(1);

            usuarioService.dejarDeSeguirUsuario(1L, 2L);

            assertThat(ana.getSeguidos()).doesNotContain(luis);
            assertThat(luis.getSeguidores()).isZero();
        }

        @Test
        @DisplayName("El contador de seguidores nunca baja de 0")
        void contadorNoNegativo() {
            ana.getSeguidos().add(luis);
            luis.setSeguidores(0); // contador desincronizado

            usuarioService.dejarDeSeguirUsuario(1L, 2L);

            assertThat(luis.getSeguidores()).isZero();
        }

        @Test
        @DisplayName("No se puede dejar de seguir a quien no sigues")
        void dejarDeSeguirSinSeguir() {
            assertThatThrownBy(() -> usuarioService.dejarDeSeguirUsuario(1L, 2L))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
