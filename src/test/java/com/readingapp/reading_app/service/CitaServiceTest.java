package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.CitaDTO;
import com.readingapp.reading_app.model.Anotacion;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.LikeCita;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import com.readingapp.reading_app.repository.AnotacionRepository;
import com.readingapp.reading_app.repository.LikeCitaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CitaService - muro de citas, likes y citas guardadas")
class CitaServiceTest {

    @Mock private AnotacionRepository anotacionRepository;
    @Mock private LikeCitaRepository likeCitaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private NotificacionService notificacionService;

    @InjectMocks private CitaService citaService;

    private Usuario ana, luis;
    private Libro libro;

    @BeforeEach
    void setUp() {
        ana = Usuario.builder().idusuario(1L).nombre("ana").citasGuardadas(new HashSet<>()).build();
        luis = Usuario.builder().idusuario(2L).nombre("luis").citasGuardadas(new HashSet<>()).build();
        libro = Libro.builder().idlibro(10L).titulo("Las ratas")
                .autor(Autor.builder().idautor(5L).nombre("Miguel Delibes").build()).build();
        lenient().when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));
        // Ana es quien usa la aplicación en estos tests
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "ana@test.com", 1L, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    private Anotacion anotacion(Long id, Usuario autor, TipoAnotacion tipo, boolean publica, String texto) {
        Anotacion a = Anotacion.builder().idanotacion(id).usuario(autor).libro(libro).tipo(tipo)
                .esPublica(publica).tieneSpoiler(false).texto(texto).fecha(LocalDateTime.now()).build();
        lenient().when(anotacionRepository.findById(id)).thenReturn(Optional.of(a));
        return a;
    }

    private List<String> textos(CitaDTO.Pagina pagina) {
        return pagina.getCitas().stream().map(CitaDTO.Response::getTexto).toList();
    }

    // === MURO DE LA COMUNIDAD ===

    @Test
    @DisplayName("\"Recientes\" pide las citas públicas y las devuelve en ese orden")
    void recientes() {
        Anotacion segunda = anotacion(21L, ana, TipoAnotacion.CITA, true, "Segunda cita");
        Anotacion primera = anotacion(20L, luis, TipoAnotacion.CITA, true, "Primera cita");
        when(anotacionRepository.findByTipoAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(eq(TipoAnotacion.CITA), any()))
                .thenReturn(new PageImpl<>(List.of(segunda, primera), PageRequest.of(0, 20), 2));

        CitaDTO.Pagina pagina = citaService.obtenerComunidad("recientes", 0, 20);

        assertThat(textos(pagina)).containsExactly("Segunda cita", "Primera cita");
        assertThat(pagina.getCitas().get(0).getTituloLibro()).isEqualTo("Las ratas");
    }

    @Test
    @DisplayName("\"Populares\" respeta el orden por likes aunque la base de datos devuelva las citas desordenadas")
    void populares() {
        Anotacion masLikeada = anotacion(30L, luis, TipoAnotacion.CITA, true, "La más likeada");
        Anotacion menosLikeada = anotacion(31L, luis, TipoAnotacion.CITA, true, "La menos likeada");
        when(anotacionRepository.findIdsCitasPopulares(any(), any()))
                .thenReturn(new PageImpl<>(List.of(30L, 31L), PageRequest.of(0, 20), 2));
        when(anotacionRepository.findAllById(List.of(30L, 31L))).thenReturn(List.of(menosLikeada, masLikeada));

        assertThat(textos(citaService.obtenerComunidad("populares", 0, 20)))
                .containsExactly("La más likeada", "La menos likeada");
    }

    @Test
    @DisplayName("Cada cita indica si la has guardado o likeado y cuántos likes y guardados tiene")
    void marcasYContadores() {
        Anotacion cita = anotacion(40L, luis, TipoAnotacion.CITA, true, "Cita");
        when(anotacionRepository.findByTipoAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(eq(TipoAnotacion.CITA), any()))
                .thenReturn(new PageImpl<>(List.of(cita), PageRequest.of(0, 20), 1));
        when(anotacionRepository.findIdsGuardadas(eq(1L), anyList())).thenReturn(List.of(40L));
        when(likeCitaRepository.findIdsLikeadas(eq(1L), anyList())).thenReturn(List.of(40L));
        when(likeCitaRepository.contarPorCita(anyList())).thenReturn(List.<Object[]>of(new Object[]{40L, 3L}));
        when(anotacionRepository.contarGuardados(anyList())).thenReturn(List.<Object[]>of(new Object[]{40L, 2L}));

        CitaDTO.Response r = citaService.obtenerComunidad("recientes", 0, 20).getCitas().get(0);

        assertThat(r.getGuardada()).isTrue();
        assertThat(r.getLikeada()).isTrue();
        assertThat(r.getLikes()).isEqualTo(3);
        assertThat(r.getVecesGuardada()).isEqualTo(2);
    }

    @Test
    @DisplayName("La paginación indica si hay más citas")
    void paginacion() {
        Anotacion cita = anotacion(50L, luis, TipoAnotacion.CITA, true, "Cita");
        when(anotacionRepository.findByTipoAndEsPublicaTrueOrderByFechaDescIdanotacionDesc(eq(TipoAnotacion.CITA), any()))
                .thenReturn(new PageImpl<>(List.of(cita), PageRequest.of(0, 1), 3));

        assertThat(citaService.obtenerComunidad("recientes", 0, 1).getHayMas()).isTrue();
    }

    // === GUARDAR EN EL MURAL ===

    @Test
    @DisplayName("Guardar una cita la añade a tus citas guardadas; quitarla la saca")
    void guardarYQuitar() {
        Anotacion cita = anotacion(60L, luis, TipoAnotacion.CITA, true, "Una cita bonita");

        citaService.guardar(60L);
        assertThat(ana.getCitasGuardadas()).containsExactly(cita);

        citaService.quitar(60L);
        assertThat(ana.getCitasGuardadas()).isEmpty();
        verify(usuarioRepository, times(2)).save(ana);
    }

    @Test
    @DisplayName("No se pueden guardar citas privadas de otros ni notas")
    void noGuardarPrivadasNiNotas() {
        anotacion(61L, luis, TipoAnotacion.CITA, false, "Privada");
        anotacion(62L, luis, TipoAnotacion.NOTA, true, "Nota");

        assertThatThrownBy(() -> citaService.guardar(61L)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> citaService.guardar(62L)).isInstanceOf(IllegalArgumentException.class);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Una cita propia se puede guardar aunque sea privada")
    void guardarPropiaPrivada() {
        Anotacion propia = anotacion(63L, ana, TipoAnotacion.CITA, false, "Mía y privada");

        citaService.guardar(63L);

        assertThat(ana.getCitasGuardadas()).containsExactly(propia);
    }

    // === LIKES ===

    @Test
    @DisplayName("Dar like a una cita lo guarda y avisa a su autor")
    void likeAvisaAlAutor() {
        Anotacion cita = anotacion(70L, luis, TipoAnotacion.CITA, true, "Cita de Luis");

        citaService.darLike(70L);

        verify(likeCitaRepository).save(any(LikeCita.class));
        verify(notificacionService).crearNotificacionLikeCita(cita, ana);
    }

    @Test
    @DisplayName("Dar like dos veces no crea otro like ni otro aviso")
    void likeRepetido() {
        anotacion(71L, luis, TipoAnotacion.CITA, true, "Cita de Luis");
        when(likeCitaRepository.existsByUsuarioIdusuarioAndAnotacionIdanotacion(1L, 71L)).thenReturn(true);

        citaService.darLike(71L);

        verify(likeCitaRepository, never()).save(any());
        verify(notificacionService, never()).crearNotificacionLikeCita(any(), any());
    }

    @Test
    @DisplayName("A las citas propias se les puede dar like, pero sin avisarse a uno mismo")
    void likePropia() {
        anotacion(72L, ana, TipoAnotacion.CITA, true, "Mía");

        citaService.darLike(72L);

        verify(likeCitaRepository).save(any(LikeCita.class));
        verify(notificacionService, never()).crearNotificacionLikeCita(any(), any());
    }

    @Test
    @DisplayName("No se puede dar like a citas privadas de otros")
    void likePrivadaDeOtro() {
        anotacion(73L, luis, TipoAnotacion.CITA, false, "Privada");

        assertThatThrownBy(() -> citaService.darLike(73L)).isInstanceOf(IllegalArgumentException.class);
        verify(likeCitaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Quitar el like lo borra para el usuario de la sesión")
    void quitarLike() {
        citaService.quitarLike(74L);

        verify(likeCitaRepository).quitar(1L, 74L);
    }
}
