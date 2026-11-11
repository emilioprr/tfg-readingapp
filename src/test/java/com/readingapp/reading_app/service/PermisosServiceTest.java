package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.AutorDTO;
import com.readingapp.reading_app.dto.ListaDTO;
import com.readingapp.reading_app.model.*;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import com.readingapp.reading_app.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Permisos en servicios - propietario, admin y contenido privado")
class PermisosServiceTest {

    @Mock private NotificacionRepository notificacionRepository;
    @Mock private SeguimientoRepository seguimientoRepository;
    @Mock private ListaRepository listaRepository;
    @Mock private LikeListaRepository likeListaRepository;
    @Mock private AnotacionRepository anotacionRepository;
    @Mock private LikeCitaRepository likeCitaRepository;
    @Mock private ValoracionRepository valoracionRepository;
    @Mock private ResenaRepository resenaRepository;
    @Mock private RecomendacionRepository recomendacionRepository;
    @Mock private RetoRepository retoRepository;
    @Mock private AutorRepository autorRepository;
    @Mock private LibroRepository libroRepository;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks private NotificacionService notificacionService;
    @InjectMocks private SeguimientoService seguimientoService;
    @InjectMocks private ListaService listaService;
    @InjectMocks private AnotacionService anotacionService;
    @InjectMocks private ResenaService resenaService;
    @InjectMocks private RecomendacionService recomendacionService;
    @InjectMocks private RetoService retoService;
    @InjectMocks private AutorService autorService;

    private static final Long ID_PROPIETARIO = 1L;
    private static final Long ID_OTRO = 2L;
    private static final Long ID_TERCERO = 3L;

    private Usuario propietario;
    private Usuario otro;
    private Libro libro;

    @BeforeEach
    void setUp() {
        propietario = Usuario.builder().idusuario(ID_PROPIETARIO).nombre("ana").build();
        otro = Usuario.builder().idusuario(ID_OTRO).nombre("luis").build();
        libro = Libro.builder().idlibro(10L).titulo("Libro de prueba")
                .autor(Autor.builder().idautor(5L).nombre("Autor").build()).build();
    }

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    // ===== Helpers =====

    /*Simula lo que hace JwtFilter: credentials = id del usuario, authority = ROLE_<rol>.*/
    private void autenticarComo(Long idusuario, String rol) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "usuario" + idusuario + "@test.com", idusuario,
                List.of(new SimpleGrantedAuthority("ROLE_" + rol))));
    }

    private Lista lista(Long id, boolean publica) {
        return Lista.builder().idlista(id).nombre("Lista " + id).esPublica(publica)
                .usuario(propietario).libros(new HashSet<>()).build();
    }

    // ===== Borrados solo por el propietario (o admin) =====

    @Nested
    @DisplayName("Notificaciones")
    class Notificaciones {

        private Notificacion notificacion;

        @BeforeEach
        void setUp() {
            notificacion = Notificacion.builder().idnotificacion(20L).usuario(propietario).build();
            when(notificacionRepository.findById(20L)).thenReturn(Optional.of(notificacion));
        }

        @Test
        @DisplayName("el propietario puede borrar su notificación")
        void propietarioBorra() {
            autenticarComo(ID_PROPIETARIO, "USER");
            notificacionService.eliminar(20L);
            verify(notificacionRepository).delete(notificacion);
        }

        @Test
        @DisplayName("otro usuario no puede borrar una notificación ajena")
        void otroNoBorra() {
            autenticarComo(ID_OTRO, "USER");
            assertThatThrownBy(() -> notificacionService.eliminar(20L))
                    .isInstanceOf(AccessDeniedException.class);
            verify(notificacionRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("Seguimientos")
    class Seguimientos {

        private Seguimiento seguimiento;

        @BeforeEach
        void setUp() {
            seguimiento = Seguimiento.builder().idseguimiento(30L).usuario(propietario).libro(libro).build();
            when(seguimientoRepository.findById(30L)).thenReturn(Optional.of(seguimiento));
        }

        @Test
        @DisplayName("el propietario puede borrar su seguimiento")
        void propietarioBorra() {
            autenticarComo(ID_PROPIETARIO, "USER");
            seguimientoService.eliminar(30L);
            verify(seguimientoRepository).delete(seguimiento);
        }

        @Test
        @DisplayName("un admin puede borrar el seguimiento de otro")
        void adminBorra() {
            autenticarComo(ID_OTRO, "ADMIN");
            seguimientoService.eliminar(30L);
            verify(seguimientoRepository).delete(seguimiento);
        }

        @Test
        @DisplayName("otro usuario no puede borrar un seguimiento ajeno")
        void otroNoBorra() {
            autenticarComo(ID_OTRO, "USER");
            assertThatThrownBy(() -> seguimientoService.eliminar(30L))
                    .isInstanceOf(AccessDeniedException.class);
            verify(seguimientoRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("Recomendaciones")
    class Recomendaciones {

        private Recomendacion recomendacion;

        @BeforeEach
        void setUp() {
            // propietario envía, otro recibe
            recomendacion = Recomendacion.builder().idrecomendacion(40L)
                    .emisor(propietario).receptor(otro).libro(libro).build();
            when(recomendacionRepository.findById(40L)).thenReturn(Optional.of(recomendacion));
        }

        @Test
        @DisplayName("el emisor puede borrarla")
        void emisorBorra() {
            autenticarComo(ID_PROPIETARIO, "USER");
            recomendacionService.eliminar(40L);
            verify(recomendacionRepository).delete(recomendacion);
        }

        @Test
        @DisplayName("el receptor puede borrarla")
        void receptorBorra() {
            autenticarComo(ID_OTRO, "USER");
            recomendacionService.eliminar(40L);
            verify(recomendacionRepository).delete(recomendacion);
        }

        @Test
        @DisplayName("un tercero no puede borrarla")
        void terceroNoBorra() {
            autenticarComo(ID_TERCERO, "USER");
            assertThatThrownBy(() -> recomendacionService.eliminar(40L))
                    .isInstanceOf(AccessDeniedException.class);
            verify(recomendacionRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("Retos")
    class Retos {

        @Test
        @DisplayName("un usuario normal no puede borrar un reto del sistema")
        void usuarioNoBorraRetoSistema() {
            Reto retoSistema = Reto.builder().idreto(50L).titulo("Reto del sistema").creador(null).build();
            when(retoRepository.findById(50L)).thenReturn(Optional.of(retoSistema));
            autenticarComo(ID_PROPIETARIO, "USER");

            assertThatThrownBy(() -> retoService.eliminar(50L, ID_PROPIETARIO))
                    .isInstanceOf(AccessDeniedException.class);
            verify(retoRepository, never()).delete(any());
        }

        @Test
        @DisplayName("un admin puede borrar un reto del sistema")
        void adminBorraRetoSistema() {
            Reto retoSistema = Reto.builder().idreto(50L).titulo("Reto del sistema").creador(null).build();
            when(retoRepository.findById(50L)).thenReturn(Optional.of(retoSistema));
            autenticarComo(ID_OTRO, "ADMIN");

            retoService.eliminar(50L, ID_OTRO);
            verify(retoRepository).delete(retoSistema);
        }

        @Test
        @DisplayName("el creador puede borrar su propio reto")
        void creadorBorra() {
            Reto retoPropio = Reto.builder().idreto(51L).titulo("Mi reto").creador(propietario).build();
            when(retoRepository.findById(51L)).thenReturn(Optional.of(retoPropio));
            autenticarComo(ID_PROPIETARIO, "USER");

            retoService.eliminar(51L, ID_PROPIETARIO);
            verify(retoRepository).delete(retoPropio);
        }

        @Test
        @DisplayName("otro usuario no puede borrar un reto ajeno")
        void otroNoBorra() {
            Reto retoPropio = Reto.builder().idreto(51L).titulo("Mi reto").creador(propietario).build();
            when(retoRepository.findById(51L)).thenReturn(Optional.of(retoPropio));
            autenticarComo(ID_OTRO, "USER");

            assertThatThrownBy(() -> retoService.eliminar(51L, ID_OTRO))
                    .isInstanceOf(AccessDeniedException.class);
            verify(retoRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("Autores - solo admin")
    class Autores {

        @Test
        @DisplayName("un usuario normal no puede crear autores")
        void usuarioNoCrea() {
            autenticarComo(ID_PROPIETARIO, "USER");
            AutorDTO.CreateRequest request = new AutorDTO.CreateRequest();
            request.setNombre("Nuevo autor");

            assertThatThrownBy(() -> autorService.crear(request))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("administrador");
            verify(autorRepository, never()).save(any());
        }

        @Test
        @DisplayName("un usuario normal no puede borrar autores")
        void usuarioNoBorra() {
            autenticarComo(ID_PROPIETARIO, "USER");
            assertThatThrownBy(() -> autorService.eliminar(5L))
                    .isInstanceOf(AccessDeniedException.class);
            verify(autorRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("un admin puede borrar autores")
        void adminBorra() {
            autenticarComo(ID_PROPIETARIO, "ADMIN");
            when(autorRepository.existsById(5L)).thenReturn(true);
            autorService.eliminar(5L);
            verify(autorRepository).deleteById(5L);
        }
    }

    // ===== Contenido privado =====

    @Nested
    @DisplayName("Listas privadas")
    class ListasPrivadas {

        @Test
        @DisplayName("otro usuario no puede ver una lista privada")
        void otroNoVePrivada() {
            when(listaRepository.findById(60L)).thenReturn(Optional.of(lista(60L, false)));
            autenticarComo(ID_OTRO, "USER");

            assertThatThrownBy(() -> listaService.obtenerPorId(60L))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("el propietario sí ve su lista privada")
        void propietarioVePrivada() {
            when(listaRepository.findById(60L)).thenReturn(Optional.of(lista(60L, false)));
            autenticarComo(ID_PROPIETARIO, "USER");

            assertThat(listaService.obtenerPorId(60L).getIdlista()).isEqualTo(60L);
        }

        @Test
        @DisplayName("una lista pública la ve cualquiera, incluso sin sesión")
        void publicaSinSesion() {
            when(listaRepository.findById(61L)).thenReturn(Optional.of(lista(61L, true)));

            assertThatCode(() -> listaService.obtenerPorId(61L)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("al ver las listas de otro usuario solo aparecen las públicas")
        void listadoFiltraPrivadas() {
            when(listaRepository.findByUsuarioIdusuario(ID_PROPIETARIO))
                    .thenReturn(List.of(lista(60L, false), lista(61L, true)));
            autenticarComo(ID_OTRO, "USER");

            List<ListaDTO.Response> listas = listaService.obtenerPorUsuario(ID_PROPIETARIO);

            assertThat(listas).extracting(ListaDTO.Response::getIdlista).containsExactly(61L);
        }

        @Test
        @DisplayName("el propietario ve todas sus listas")
        void propietarioVeTodas() {
            when(listaRepository.findByUsuarioIdusuario(ID_PROPIETARIO))
                    .thenReturn(List.of(lista(60L, false), lista(61L, true)));
            autenticarComo(ID_PROPIETARIO, "USER");

            assertThat(listaService.obtenerPorUsuario(ID_PROPIETARIO)).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Reseñas privadas")
    class ResenasPrivadas {

        @Test
        @DisplayName("otro usuario no puede ver una reseña privada")
        void otroNoVePrivada() {
            Resena resena = Resena.builder().idresena(70L).esPublica(false)
                    .usuario(propietario).libro(libro).build();
            when(resenaRepository.findById(70L)).thenReturn(Optional.of(resena));
            autenticarComo(ID_OTRO, "USER");

            assertThatThrownBy(() -> resenaService.obtenerPorId(70L))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("el propietario sí ve su reseña privada")
        void propietarioVePrivada() {
            Resena resena = Resena.builder().idresena(70L).esPublica(false)
                    .usuario(propietario).libro(libro).build();
            when(resenaRepository.findById(70L)).thenReturn(Optional.of(resena));
            autenticarComo(ID_PROPIETARIO, "USER");

            assertThat(resenaService.obtenerPorId(70L).getIdresena()).isEqualTo(70L);
        }
    }

    @Nested
    @DisplayName("Anotaciones privadas")
    class AnotacionesPrivadas {

        @Test
        @DisplayName("otro usuario no puede ver una anotación privada")
        void otroNoVePrivada() {
            Anotacion anotacion = Anotacion.builder().idanotacion(80L).esPublica(false)
                    .tipo(TipoAnotacion.NOTA).usuario(propietario).libro(libro).build();
            when(anotacionRepository.findById(80L)).thenReturn(Optional.of(anotacion));
            autenticarComo(ID_OTRO, "USER");

            assertThatThrownBy(() -> anotacionService.obtenerPorId(80L))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("al ver las anotaciones de otro usuario se consultan solo las públicas")
        void otroSoloPublicas() {
            autenticarComo(ID_OTRO, "USER");

            anotacionService.obtenerPorUsuario(ID_PROPIETARIO, Pageable.unpaged());

            verify(anotacionRepository).findByUsuarioIdusuarioAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(ID_PROPIETARIO, Pageable.unpaged());
            verify(anotacionRepository, never()).findByUsuarioIdusuarioOrderByFechaDescIdanotacionDesc(any(), any());
        }

        @Test
        @DisplayName("sin sesión también se consultan solo las públicas")
        void anonimoSoloPublicas() {
            anotacionService.obtenerPorUsuario(ID_PROPIETARIO, Pageable.unpaged());

            verify(anotacionRepository).findByUsuarioIdusuarioAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(ID_PROPIETARIO, Pageable.unpaged());
        }

        @Test
        @DisplayName("el propietario consulta todas sus anotaciones")
        void propietarioTodas() {
            autenticarComo(ID_PROPIETARIO, "USER");

            anotacionService.obtenerPorUsuario(ID_PROPIETARIO, Pageable.unpaged());

            verify(anotacionRepository).findByUsuarioIdusuarioOrderByFechaDescIdanotacionDesc(ID_PROPIETARIO, Pageable.unpaged());
            verify(anotacionRepository, never()).findByUsuarioIdusuarioAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(any(), any());
        }
    }
}
