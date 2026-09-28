package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.ListaDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Lista;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.LibroRepository;
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

    private Lista lista(boolean automatica) {
        Lista l = Lista.builder().idlista(20L).nombre("Favoritos del verano").esPublica(true)
                .esAutomatica(automatica).usuario(ana).libros(new HashSet<>()).build();
        when(listaRepository.findById(20L)).thenReturn(Optional.of(l));
        return l;
    }

    @Test
    @DisplayName("Una lista nueva es pública por defecto y nunca automática")
    void crearValoresPorDefecto() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(ana));
        ListaDTO.CreateRequest r = new ListaDTO.CreateRequest();
        r.setNombre("Para el verano");
        r.setEsPublica(null);

        ListaDTO.Response res = listaService.crear(1L, r);

        assertThat(res.getEsPublica()).isTrue();
        assertThat(res.getEsAutomatica()).isFalse();
        assertThat(res.getNombre()).isEqualTo("Para el verano");
    }

    @Test
    @DisplayName("Añadir un libro a una lista")
    void agregarLibro() {
        Lista l = lista(false);
        when(libroRepository.findById(10L)).thenReturn(Optional.of(libro));

        listaService.agregarLibro(20L, 10L);

        assertThat(l.getLibros()).containsExactly(libro);
    }

    @Test
    @DisplayName("Añadir dos veces el mismo libro no lo duplica")
    void agregarLibroDosVeces() {
        Lista l = lista(false);
        when(libroRepository.findById(10L)).thenReturn(Optional.of(libro));

        listaService.agregarLibro(20L, 10L);
        listaService.agregarLibro(20L, 10L);

        assertThat(l.getLibros()).hasSize(1);
    }

    @Test
    @DisplayName("Quitar un libro de una lista")
    void quitarLibro() {
        Lista l = lista(false);
        l.getLibros().add(libro);

        listaService.quitarLibro(20L, 10L);

        assertThat(l.getLibros()).isEmpty();
    }

    @Test
    @DisplayName("Solo se actualiza lo que se envía")
    void actualizarParcial() {
        Lista l = lista(false);
        ListaDTO.UpdateRequest r = new ListaDTO.UpdateRequest();
        r.setEsPublica(false);

        listaService.actualizar(20L, r);

        assertThat(l.getEsPublica()).isFalse();
        assertThat(l.getNombre()).isEqualTo("Favoritos del verano");
    }

    @Test
    @DisplayName("Las listas automáticas no se pueden editar")
    void automaticaNoSeEdita() {
        lista(true);
        ListaDTO.UpdateRequest r = new ListaDTO.UpdateRequest();
        r.setNombre("Otro nombre");

        assertThatThrownBy(() -> listaService.actualizar(20L, r))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("automática");
    }

    @Test
    @DisplayName("Las listas automáticas no se pueden borrar")
    void automaticaNoSeBorra() {
        lista(true);

        assertThatThrownBy(() -> listaService.eliminar(20L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(listaRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Otro usuario no puede añadir libros a mi lista")
    void otroNoAnadeLibros() {
        lista(false);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "luis@test.com", 2L, List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        assertThatThrownBy(() -> listaService.agregarLibro(20L, 10L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
