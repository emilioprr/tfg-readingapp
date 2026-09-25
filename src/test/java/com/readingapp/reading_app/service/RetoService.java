package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.RetoDTO;
import com.readingapp.reading_app.model.ParticipanteReto;
import com.readingapp.reading_app.model.Reto;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.model.enums.ModalidadReto;
import com.readingapp.reading_app.model.enums.TipoReto;
import com.readingapp.reading_app.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RetoService - creación, participación y progreso de retos")
class RetoServiceTest {

    @Mock private RetoRepository retoRepository;
    @Mock private ParticipanteRetoRepository participanteRetoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private AutorRepository autorRepository;
    @Mock private SeguimientoRepository seguimientoRepository;
    @Mock private SesionLecturaRepository sesionLecturaRepository;
    @Mock private NotificacionService notificacionService;

    private RetoService retoService;
    private Usuario usuario;
    private Usuario seguidor;

    private static final Long ID_USUARIO = 1L;
    private static final ZoneId ZONA = ZoneId.of("Europe/Madrid");
    private static final LocalDate HOY = LocalDate.of(2026, 9, 23);

    @BeforeEach
    void setUp() {
        Clock relojFijo = Clock.fixed(HOY.atTime(12, 0).atZone(ZONA).toInstant(), ZONA);
        retoService = new RetoService(retoRepository, participanteRetoRepository, usuarioRepository,
                autorRepository, seguimientoRepository, sesionLecturaRepository, notificacionService, relojFijo);

        seguidor = mock(Usuario.class);
        usuario = mock(Usuario.class);
        lenient().when(usuario.getIdusuario()).thenReturn(ID_USUARIO);
        lenient().when(usuario.getNombre()).thenReturn("ana");
        lenient().when(usuario.getSeguidoresList()).thenReturn(Set.of(seguidor));

        lenient().when(usuarioRepository.findById(ID_USUARIO)).thenReturn(Optional.of(usuario));
        lenient().when(retoRepository.save(any(Reto.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(participanteRetoRepository.save(any(ParticipanteReto.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void limpiarSeguridad() {
        SecurityContextHolder.clearContext();
    }

    // ===== Helpers =====

    private Reto reto(Long id, TipoReto tipo, ModalidadReto modalidad, int meta) {
        Reto reto = Reto.builder()
                .idreto(id).titulo("Reto de prueba").tipo(tipo).modalidad(modalidad).meta(meta)
                .fechaInicio(HOY.minusDays(10)).fechaFin(HOY.plusDays(20))
                .participantes(new ArrayList<>())
                .build();
        lenient().when(retoRepository.findById(id)).thenReturn(Optional.of(reto));
        return reto;
    }

    private ParticipanteReto participante(Reto reto, Usuario u, boolean cumplido) {
        ParticipanteReto p = ParticipanteReto.builder()
                .idparticipante(100L + reto.getIdreto()).reto(reto).usuario(u)
                .progreso(0).retoCumplido(cumplido).fechaUnion(HOY.atStartOfDay())
                .build();
        lenient().when(participanteRetoRepository.findByRetoIdretoAndUsuarioIdusuario(reto.getIdreto(), u.getIdusuario()))
                .thenReturn(Optional.of(p));
        return p;
    }

    private RetoDTO.CreateRequest peticion(ModalidadReto modalidad, LocalDate fechaFin) {
        return RetoDTO.CreateRequest.builder()
                .titulo("Nuevo reto").tipo(TipoReto.LIBROS).modalidad(modalidad)
                .meta(5).fechaFin(fechaFin).idCreador(ID_USUARIO)
                .build();
    }

    private void autenticarComo(String rol) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "ana", ID_USUARIO, List.of(new SimpleGrantedAuthority("ROLE_" + rol))));
    }

    private void librosLeidos(long cantidad) {
        when(seguimientoRepository.countByUsuarioIdusuarioAndEstadoAndFechaBetween(
                eq(ID_USUARIO), eq(EstadoLectura.LEIDO), any(), any())).thenReturn(cantidad);
    }

    // ===== Creación =====

    @Nested
    @DisplayName("Creación de retos")
    class Creacion {

        @Test
        @DisplayName("Un reto personal añade automáticamente al creador como participante")
        void personalAnadeCreador() {
            RetoDTO.Response res = retoService.crear(peticion(ModalidadReto.PERSONAL, HOY.plusDays(30)));

            assertThat(res.getFechaInicio()).isEqualTo(HOY.toString());
            verify(participanteRetoRepository).save(argThat(p ->
                    p.getUsuario() == usuario && p.getProgreso() == 0 && !p.getRetoCumplido()));
        }

        @Test
        @DisplayName("Un reto compartido no añade participantes al crearse")
        void compartidoSinParticipantes() {
            retoService.crear(peticion(ModalidadReto.COMPARTIDO, HOY.plusDays(30)));

            verify(participanteRetoRepository, never()).save(any());
        }

        @Test
        @DisplayName("Un reto personal sin creador no se puede crear")
        void personalSinCreador() {
            RetoDTO.CreateRequest request = peticion(ModalidadReto.PERSONAL, HOY.plusDays(30));
            request.setIdCreador(null);

            assertThatThrownBy(() -> retoService.crear(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("requieren un creador");
        }

        @Test
        @DisplayName("La fecha límite no puede ser anterior a hoy")
        void fechaFinPasada() {
            assertThatThrownBy(() -> retoService.crear(peticion(ModalidadReto.PERSONAL, HOY.minusDays(1))))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("anterior a hoy");
            verify(retoRepository, never()).save(any());
        }

        @Test
        @DisplayName("Un usuario normal no puede crear retos oficiales")
        void oficialSinAdmin() {
            autenticarComo("USER");

            assertThatThrownBy(() -> retoService.crear(peticion(ModalidadReto.PREDEFINIDO, HOY.plusDays(30))))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("administrador");
            verify(retoRepository, never()).save(any());
        }

        @Test
        @DisplayName("Un administrador puede crear retos colaborativos")
        void colaborativoConAdmin() {
            autenticarComo("ADMIN");

            RetoDTO.Response res = retoService.crear(peticion(ModalidadReto.COLABORATIVO, HOY.plusDays(30)));

            assertThat(res.getModalidad()).isEqualTo(ModalidadReto.COLABORATIVO);
            verify(retoRepository).save(any(Reto.class));
        }
    }

    // ===== Participación =====

    @Nested
    @DisplayName("Unirse y abandonar")
    class Participacion {

        @Test
        @DisplayName("Se puede unir a un reto compartido")
        void unirseACompartido() {
            reto(1L, TipoReto.LIBROS, ModalidadReto.COMPARTIDO, 5);
            when(participanteRetoRepository.existsByRetoIdretoAndUsuarioIdusuario(1L, ID_USUARIO)).thenReturn(false);

            RetoDTO.ParticipanteResponse res = retoService.unirse(1L, ID_USUARIO);

            assertThat(res.getProgreso()).isZero();
            assertThat(res.getRetoCumplido()).isFalse();
        }

        @Test
        @DisplayName("No se puede unir a un reto personal")
        void noUnirseAPersonal() {
            reto(1L, TipoReto.LIBROS, ModalidadReto.PERSONAL, 5);

            assertThatThrownBy(() -> retoService.unirse(1L, ID_USUARIO))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("personal");
        }

        @Test
        @DisplayName("No se puede unir dos veces al mismo reto")
        void noUnirseDosVeces() {
            reto(1L, TipoReto.LIBROS, ModalidadReto.COMPARTIDO, 5);
            when(participanteRetoRepository.existsByRetoIdretoAndUsuarioIdusuario(1L, ID_USUARIO)).thenReturn(true);

            assertThatThrownBy(() -> retoService.unirse(1L, ID_USUARIO))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Ya participas");
        }

        @Test
        @DisplayName("Se puede abandonar un reto compartido")
        void abandonarCompartido() {
            Reto reto = reto(1L, TipoReto.LIBROS, ModalidadReto.COMPARTIDO, 5);
            ParticipanteReto p = participante(reto, usuario, false);

            retoService.abandonar(1L, ID_USUARIO);

            verify(participanteRetoRepository).delete(p);
        }

        @Test
        @DisplayName("Un reto personal no se abandona, se elimina")
        void noAbandonarPersonal() {
            Reto reto = reto(1L, TipoReto.LIBROS, ModalidadReto.PERSONAL, 5);
            participante(reto, usuario, false);

            assertThatThrownBy(() -> retoService.abandonar(1L, ID_USUARIO))
                    .isInstanceOf(IllegalArgumentException.class);
            verify(participanteRetoRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Abandonar un reto en el que no se participa falla")
        void abandonarSinParticipar() {
            when(participanteRetoRepository.findByRetoIdretoAndUsuarioIdusuario(1L, ID_USUARIO))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> retoService.abandonar(1L, ID_USUARIO))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // ===== Progreso =====

    @Nested
    @DisplayName("Cálculo de progreso")
    class Progreso {

        @Test
        @DisplayName("Reto de libros: cuenta los libros leídos y calcula el porcentaje")
        void progresoLibros() {
            Reto reto = reto(1L, TipoReto.LIBROS, ModalidadReto.PERSONAL, 5);
            participante(reto, usuario, false);
            librosLeidos(3);

            RetoDTO.ParticipanteResponse res = retoService.recalcularProgreso(1L, ID_USUARIO);

            assertThat(res.getProgreso()).isEqualTo(3);
            assertThat(res.getPorcentaje()).isEqualTo(60.0);
            assertThat(res.getRetoCumplido()).isFalse();
        }

        @Test
        @DisplayName("Reto de horas: el progreso en minutos se compara con la meta en horas")
        void progresoHoras() {
            Reto reto = reto(1L, TipoReto.HORAS, ModalidadReto.PERSONAL, 2);
            participante(reto, usuario, false);
            when(sesionLecturaRepository.sumMinutosByUsuarioEntreFechas(eq(ID_USUARIO), any(), any())).thenReturn(90);

            RetoDTO.ParticipanteResponse res = retoService.recalcularProgreso(1L, ID_USUARIO);

            assertThat(res.getProgreso()).isEqualTo(90);   // minutos
            assertThat(res.getMeta()).isEqualTo(2);        // horas
            assertThat(res.getPorcentaje()).isEqualTo(75.0);
            assertThat(res.getRetoCumplido()).isFalse();
        }

        @Test
        @DisplayName("Reto de horas: se completa al superar la meta en minutos")
        void horasCompletado() {
            Reto reto = reto(1L, TipoReto.HORAS, ModalidadReto.PERSONAL, 2);
            participante(reto, usuario, false);
            when(sesionLecturaRepository.sumMinutosByUsuarioEntreFechas(eq(ID_USUARIO), any(), any())).thenReturn(125);

            RetoDTO.ParticipanteResponse res = retoService.recalcularProgreso(1L, ID_USUARIO);

            assertThat(res.getRetoCumplido()).isTrue();
            assertThat(res.getPorcentaje()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("Reto de páginas: suma las páginas leídas en el periodo")
        void progresoPaginas() {
            Reto reto = reto(1L, TipoReto.PAGINAS, ModalidadReto.PERSONAL, 1000);
            participante(reto, usuario, false);
            when(seguimientoRepository.sumPaginasByUsuarioEntreFechas(eq(ID_USUARIO), any(), any())).thenReturn(250L);

            RetoDTO.ParticipanteResponse res = retoService.recalcularProgreso(1L, ID_USUARIO);

            assertThat(res.getProgreso()).isEqualTo(250);
            assertThat(res.getPorcentaje()).isEqualTo(25.0);
        }

        @Test
        @DisplayName("Al completar un reto se notifica al usuario y a sus seguidores")
        void completarNotifica() {
            Reto reto = reto(1L, TipoReto.LIBROS, ModalidadReto.PERSONAL, 3);
            ParticipanteReto p = participante(reto, usuario, false);
            librosLeidos(3);

            retoService.recalcularProgreso(1L, ID_USUARIO);

            assertThat(p.getRetoCumplido()).isTrue();
            assertThat(p.getFechaCumplimiento()).isEqualTo(HOY.atTime(12, 0));
            verify(notificacionService).crearNotificacionRetoCumplido(reto, usuario, usuario);
            verify(notificacionService).crearNotificacionRetoCumplido(reto, usuario, seguidor);
        }

        @Test
        @DisplayName("Un reto ya cumplido no se vuelve a calcular")
        void retoCumplidoNoRecalcula() {
            Reto reto = reto(1L, TipoReto.LIBROS, ModalidadReto.PERSONAL, 3);
            participante(reto, usuario, true);

            retoService.recalcularProgreso(1L, ID_USUARIO);

            verifyNoInteractions(seguimientoRepository, sesionLecturaRepository, notificacionService);
        }

        @Test
        @DisplayName("Reto colaborativo: al sumar entre todos la meta, se completa para todos")
        void colaborativoCompletaATodos() {
            Reto reto = reto(1L, TipoReto.LIBROS, ModalidadReto.COLABORATIVO, 10);
            ParticipanteReto p1 = participante(reto, usuario, false);

            Usuario otro = mock(Usuario.class);
            lenient().when(otro.getSeguidoresList()).thenReturn(Set.of());
            ParticipanteReto p2 = ParticipanteReto.builder()
                    .idparticipante(200L).reto(reto).usuario(otro)
                    .progreso(6).retoCumplido(false).fechaUnion(HOY.atStartOfDay()).build();

            librosLeidos(4);
            when(participanteRetoRepository.sumProgresoByReto(1L)).thenReturn(10);
            when(participanteRetoRepository.findActivosByReto(1L)).thenReturn(List.of(p1, p2));

            retoService.recalcularProgreso(1L, ID_USUARIO);

            assertThat(p1.getRetoCumplido()).isTrue();
            assertThat(p2.getRetoCumplido()).isTrue();
        }

        @Test
        @DisplayName("Recalcular los retos activos de un usuario actualiza cada uno")
        void recalcularTodosLosActivos() {
            Reto r1 = reto(1L, TipoReto.LIBROS, ModalidadReto.PERSONAL, 10);
            Reto r2 = reto(2L, TipoReto.PAGINAS, ModalidadReto.PERSONAL, 1000);
            ParticipanteReto p1 = participante(r1, usuario, false);
            ParticipanteReto p2 = participante(r2, usuario, false);

            when(participanteRetoRepository.findByUsuarioIdusuarioAndRetoCumplidoFalse(ID_USUARIO))
                    .thenReturn(List.of(p1, p2));
            librosLeidos(2);
            when(seguimientoRepository.sumPaginasByUsuarioEntreFechas(eq(ID_USUARIO), any(), any())).thenReturn(300L);

            retoService.recalcularRetosActivosDeUsuario(ID_USUARIO);

            assertThat(p1.getProgreso()).isEqualTo(2);
            assertThat(p2.getProgreso()).isEqualTo(300);
        }
    }

    // ===== Eliminación =====

    @Nested
    @DisplayName("Eliminación")
    class Eliminacion {

        @Test
        @DisplayName("El creador puede eliminar su reto")
        void creadorElimina() {
            Reto reto = reto(1L, TipoReto.LIBROS, ModalidadReto.COMPARTIDO, 5);
            reto.setCreador(usuario);

            retoService.eliminar(1L, ID_USUARIO);

            verify(retoRepository).delete(reto);
        }

        @Test
        @DisplayName("Otro usuario no puede eliminar un reto ajeno")
        void otroNoElimina() {
            Reto reto = reto(1L, TipoReto.LIBROS, ModalidadReto.COMPARTIDO, 5);
            reto.setCreador(usuario);

            assertThatThrownBy(() -> retoService.eliminar(1L, 2L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Solo el creador");
            verify(retoRepository, never()).delete(any());
        }
    }
}