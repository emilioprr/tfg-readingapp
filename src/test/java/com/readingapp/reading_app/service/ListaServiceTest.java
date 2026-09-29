package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.ListaDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Lista;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.LikeListaRepository;
import com.readingapp.reading_app.model.LikeLista;
import com.readingapp.reading_app.repository.ListaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ListaService - listas de libros")
class ListaServiceTest {

    @Mock private ListaRepository listaRepository;
    @Mock private LibroRepository libroRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private LikeListaRepository likeListaRepository;
    @Mock private com.readingapp.reading_app.repository.NotificacionRepository notificacionRepository;
    @Mock private NotificacionService notificacionService;

    @InjectMocks private ListaService listaService;

    private Usuario ana;
    private Libro libro;

    @BeforeEach
    void setUp() {
        ana = Usuario.builder().idusuario(1L).nombre("ana").build();
        libro = Libro.builder().idlibro(10L).titulo("Las ratas")
                .autor(Autor.builder().idautor(5L).nombre("Miguel Delibes").build()).build();
        lenient().when(listaRepository.save(any(Lista.class))).thenAnswer(inv -> inv.getArgument(0));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "ana@test.com", 1L, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    private Lista lista() {
        Lista l = Lista.builder().idlista(20L).nombre("Favoritos del verano").esPublica(true)
                .usuario(ana).libros(new HashSet<>()).build();
        when(listaRepository.findById(20L)).thenReturn(Optional.of(l));
        return l;
    }

    @Test
    @DisplayName("Mis listas para un libro indican en cuáles está ya (para marcar las casillas)")
    void misListasParaLibro() {
        Lista conLibro = Lista.builder().idlista(20L).nombre("Verano").esPublica(true).usuario(ana)
                .libros(new HashSet<>(List.of(libro))).build();
        Lista sinLibro = Lista.builder().idlista(21L).nombre("Pendientes").esPublica(false).usuario(ana)
                .libros(new HashSet<>()).build();
        when(listaRepository.findByUsuarioIdusuario(1L)).thenReturn(List.of(conLibro, sinLibro));

        assertThat(listaService.obtenerMiasParaLibro(1L, 10L))
                .extracting(ListaDTO.Response::getNombre, ListaDTO.Response::getContieneLibro)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Verano", true), org.assertj.core.groups.Tuple.tuple("Pendientes", false));
    }

    @Test
    @DisplayName("Solo puedes consultar tus propias listas para un libro")
    void misListasParaLibroSoloPropias() {
        assertThatThrownBy(() -> listaService.obtenerMiasParaLibro(2L, 10L)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Dar like a una lista pública lo guarda una sola vez")
    void likeAListaPublica() {
        lista();
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));

        listaService.darLike(20L);
        when(likeListaRepository.existsByUsuarioIdusuarioAndListaIdlista(1L, 20L)).thenReturn(true);
        listaService.darLike(20L);

        verify(likeListaRepository, times(1)).save(any(LikeLista.class));
        // Es su propia lista: no se avisa a sí misma
        verify(notificacionService, never()).crearNotificacionLikeLista(any(), any());
    }

    @Test
    @DisplayName("Dar like a la lista de otro avisa a su autor")
    void likeAvisaAlAutor() {
        Usuario luis = Usuario.builder().idusuario(2L).nombre("luis").build();
        Lista deLuis = Lista.builder().idlista(40L).nombre("De Luis").esPublica(true).usuario(luis).libros(new HashSet<>()).build();
        when(listaRepository.findById(40L)).thenReturn(Optional.of(deLuis));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));

        listaService.darLike(40L);

        verify(notificacionService).crearNotificacionLikeLista(deLuis, ana);
    }

    @Test
    @DisplayName("No se puede dar like a una lista privada de otro")
    void noLikeAPrivadaAjena() {
        Usuario luis = Usuario.builder().idusuario(2L).nombre("luis").build();
        Lista privada = Lista.builder().idlista(30L).nombre("Secreta").esPublica(false).usuario(luis).libros(new HashSet<>()).build();
        when(listaRepository.findById(30L)).thenReturn(Optional.of(privada));

        assertThatThrownBy(() -> listaService.darLike(30L)).isInstanceOf(IllegalArgumentException.class);
        verify(likeListaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Las listas llevan su número de likes y si te gustan")
    void listasConLikes() {
        Lista l = Lista.builder().idlista(20L).nombre("Verano").esPublica(true).usuario(ana).libros(new HashSet<>()).build();
        when(listaRepository.findByEsPublicaTrue()).thenReturn(List.of(l));
        when(likeListaRepository.contarPorLista(List.of(20L))).thenReturn(List.<Object[]>of(new Object[]{20L, 3L}));
        when(likeListaRepository.findIdsLikeadas(1L, List.of(20L))).thenReturn(List.of(20L));

        ListaDTO.Response r = listaService.obtenerPublicas().get(0);

        assertThat(r.getNumLikes()).isEqualTo(3);
        assertThat(r.getLikeada()).isTrue();
    }

    @Test
    @DisplayName("Al borrar una lista se borran antes sus likes")
    void borrarListaBorraLikes() {
        lista();

        listaService.eliminar(20L);

        verify(likeListaRepository).borrarDeLista(20L);
        verify(notificacionRepository).deleteByListaIdlista(20L);
        verify(listaRepository).deleteById(20L);
    }

    @Test
    @DisplayName("Una lista nueva es pública por defecto")
    void crearValoresPorDefecto() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));
        ListaDTO.CreateRequest r = new ListaDTO.CreateRequest();
        r.setNombre("Para el verano");
        r.setEsPublica(null);

        ListaDTO.Response res = listaService.crear(1L, r);

        assertThat(res.getEsPublica()).isTrue();
        assertThat(res.getNombre()).isEqualTo("Para el verano");
    }

    @Test
    @DisplayName("Añadir un libro a una lista")
    void agregarLibro() {
        Lista l = lista();
        when(libroRepository.findById(10L)).thenReturn(Optional.of(libro));

        listaService.agregarLibro(20L, 10L);

        assertThat(l.getLibros()).containsExactly(libro);
    }

    @Test
    @DisplayName("Añadir dos veces el mismo libro avisa de que ya estaba y no lo duplica")
    void agregarLibroDosVeces() {
        Lista l = lista();
        when(libroRepository.findById(10L)).thenReturn(Optional.of(libro));

        listaService.agregarLibro(20L, 10L);

        assertThatThrownBy(() -> listaService.agregarLibro(20L, 10L))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("ya está en la lista");
        assertThat(l.getLibros()).hasSize(1);
    }

    @Test
    @DisplayName("Quitar un libro de una lista")
    void quitarLibro() {
        Lista l = lista();
        l.getLibros().add(libro);

        listaService.quitarLibro(20L, 10L);

        assertThat(l.getLibros()).isEmpty();
    }

    @Test
    @DisplayName("Solo se actualiza lo que se envía")
    void actualizarParcial() {
        Lista l = lista();
        ListaDTO.UpdateRequest r = new ListaDTO.UpdateRequest();
        r.setEsPublica(false);

        listaService.actualizar(20L, r);

        assertThat(l.getEsPublica()).isFalse();
        assertThat(l.getNombre()).isEqualTo("Favoritos del verano");
    }

    @Test
    @DisplayName("Otro usuario no puede añadir libros a mi lista")
    void otroNoAnadeLibros() {
        lista();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "luis@test.com", 2L, List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        assertThatThrownBy(() -> listaService.agregarLibro(20L, 10L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
