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
        return Usuario.builder().idusuario(id).nombre(nombre)
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
            when(usuarioRepository.existsByEmailIgnoreCase("ana@test.com")).thenReturn(true);

            assertThatThrownBy(() -> usuarioService.registrar(peticion("ana2", "ana@test.com")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("email");
        }
    }

    @Test
    @DisplayName("El email se guarda en minúsculas y sin espacios")
    void emailEnMinusculas() {
        UsuarioDTO.RegistroRequest r = new UsuarioDTO.RegistroRequest();
        r.setNombre("ana");
        r.setEmail("  Ana@Gmail.COM ");
        r.setPassword("secreta123");
        ArgumentCaptor<Usuario> guardado = ArgumentCaptor.forClass(Usuario.class);

        usuarioService.registrar(r);

        verify(usuarioRepository).save(guardado.capture());
        assertThat(guardado.getValue().getEmail()).isEqualTo("ana@gmail.com");
        verify(usuarioRepository).existsByEmailIgnoreCase("ana@gmail.com");
    }

    @Nested
    @DisplayName("Cambiar contraseña")
    class CambiarPassword {

        private Usuario ana;

        @BeforeEach
        void setUp() {
            ana = usuario(1L, "ana");
            ana.setPassword("$hash-vieja");
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));
        }

        @Test
        @DisplayName("Con la contraseña actual correcta se guarda la nueva cifrada")
        void cambiaConLaActualCorrecta() {
            when(passwordEncoder.matches("vieja", "$hash-vieja")).thenReturn(true);
            when(passwordEncoder.matches("nueva123", "$hash-vieja")).thenReturn(false);
            when(passwordEncoder.encode("nueva123")).thenReturn("$hash-nueva");

            usuarioService.cambiarPassword(1L, "vieja", "nueva123");

            assertThat(ana.getPassword()).isEqualTo("$hash-nueva");
        }

        @Test
        @DisplayName("Si la contraseña actual es incorrecta no cambia nada")
        void actualIncorrecta() {
            when(passwordEncoder.matches("mala", "$hash-vieja")).thenReturn(false);

            assertThatThrownBy(() -> usuarioService.cambiarPassword(1L, "mala", "nueva123"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("actual");
            assertThat(ana.getPassword()).isEqualTo("$hash-vieja");
        }

        @Test
        @DisplayName("La nueva contraseña debe ser distinta de la actual")
        void nuevaIgualQueActual() {
            when(passwordEncoder.matches("vieja", "$hash-vieja")).thenReturn(true);

            assertThatThrownBy(() -> usuarioService.cambiarPassword(1L, "vieja", "vieja"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("distinta");
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
        @DisplayName("Seguir a alguien lo añade a mis seguidos y le avisa")
        void seguirAnadeYNotifica() {
            usuarioService.seguirUsuario(1L, 2L);

            assertThat(ana.getSeguidos()).contains(luis);
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

            assertThatThrownBy(() -> usuarioService.seguirUsuario(1L, 2L))
                    .isInstanceOf(IllegalArgumentException.class);
            assertThat(ana.getSeguidos()).hasSize(1);
            verify(notificacionService, never()).crearNotificacionSeguidor(any(), any());
        }

        @Test
        @DisplayName("Dejar de seguir lo quita de mis seguidos")
        void dejarDeSeguir() {
            ana.getSeguidos().add(luis);

            usuarioService.dejarDeSeguirUsuario(1L, 2L);

            assertThat(ana.getSeguidos()).doesNotContain(luis);
        }

        @Test
        @DisplayName("El número de seguidores se calcula a partir de la lista real")
        void seguidoresDesdeLaLista() {
            luis.getSeguidoresList().add(ana);
            when(usuarioRepository.findById(2L)).thenReturn(Optional.of(luis));

            assertThat(usuarioService.obtenerPorId(2L).getSeguidores()).isEqualTo(1);
        }

        @Test
        @DisplayName("No se puede dejar de seguir a quien no sigues")
        void dejarDeSeguirSinSeguir() {
            assertThatThrownBy(() -> usuarioService.dejarDeSeguirUsuario(1L, 2L))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
