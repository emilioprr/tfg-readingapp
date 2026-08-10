package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.LibroDTO;
import com.readingapp.reading_app.dto.ListaDTO;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Lista;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.ListaRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListaService {

    private final ListaRepository listaRepository;
    private final LibroRepository libroRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public ListaDTO.Response crear(Long usuarioId, ListaDTO.CreateRequest request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        Lista lista = Lista.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .esPublica(request.getEsPublica() != null ? request.getEsPublica() : true)
                .esAutomatica(false)
                .usuario(usuario)
                .build();

        lista = listaRepository.save(lista);
        return toResponse(lista);
    }

    public ListaDTO.DetalleResponse obtenerPorId(Long id) {
        Lista lista = buscarPorId(id);
        return toDetalleResponse(lista);
    }

    public List<ListaDTO.Response> obtenerPorUsuario(Long usuarioId) {
        return listaRepository.findByUsuarioIdusuario(usuarioId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ListaDTO.Response> obtenerPublicas() {
        return listaRepository.findByEsPublicaTrueAndEsAutomaticaFalse().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ListaDTO.Response actualizar(Long id, ListaDTO.UpdateRequest request) {
        Lista lista = buscarPorId(id);

        if (lista.getEsAutomatica()) {
            throw new IllegalArgumentException("No se puede editar una lista automática");
        }

        if (request.getNombre() != null) lista.setNombre(request.getNombre());
        if (request.getDescripcion() != null) lista.setDescripcion(request.getDescripcion());
        if (request.getEsPublica() != null) lista.setEsPublica(request.getEsPublica());

        lista = listaRepository.save(lista);
        return toResponse(lista);
    }

    @Transactional
    public void eliminar(Long id) {
        Lista lista = buscarPorId(id);
        if (lista.getEsAutomatica()) {
            throw new IllegalArgumentException("No se puede eliminar una lista automática");
        }
        listaRepository.deleteById(id);
    }

    // === GESTIÓN DE LIBROS EN LISTA ===

    @Transactional
    public void agregarLibro(Long listaId, Long libroId) {
        Lista lista = buscarPorId(listaId);
        Libro libro = libroRepository.findById(libroId)
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));
        lista.getLibros().add(libro);
        listaRepository.save(lista);
    }

    @Transactional
    public void quitarLibro(Long listaId, Long libroId) {
        Lista lista = buscarPorId(listaId);
        Libro libro = libroRepository.findById(libroId)
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));
        lista.getLibros().remove(libro);
        listaRepository.save(lista);
    }

    // === HELPERS ===

    private Lista buscarPorId(Long id) {
        return listaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lista no encontrada con id: " + id));
    }

    private ListaDTO.Response toResponse(Lista lista) {
        return ListaDTO.Response.builder()
                .idlista(lista.getIdlista())
                .nombre(lista.getNombre())
                .descripcion(lista.getDescripcion())
                .esPublica(lista.getEsPublica())
                .esAutomatica(lista.getEsAutomatica())
                .fechaCreacion(lista.getFechaCreacion() != null ? lista.getFechaCreacion().toString() : null)
                .idusuario(lista.getUsuario().getIdusuario())
                .nombreUsuario(lista.getUsuario().getNombre())
                .numLibros(lista.getLibros() != null ? lista.getLibros().size() : 0)
                .build();
    }

    private ListaDTO.DetalleResponse toDetalleResponse(Lista lista) {
        List<LibroDTO.Response> libros = lista.getLibros().stream()
                .map(libro -> LibroDTO.Response.builder()
                        .idlibro(libro.getIdlibro())
                        .titulo(libro.getTitulo())
                        .portada(libro.getPortada())
                        .genero(libro.getGenero())
                        .nombreAutor(libro.getAutor().getNombre())
                        .idautor(libro.getAutor().getIdautor())
                        .build())
                .toList();

        return ListaDTO.DetalleResponse.builder()
                .idlista(lista.getIdlista())
                .nombre(lista.getNombre())
                .descripcion(lista.getDescripcion())
                .esPublica(lista.getEsPublica())
                .esAutomatica(lista.getEsAutomatica())
                .fechaCreacion(lista.getFechaCreacion() != null ? lista.getFechaCreacion().toString() : null)
                .idusuario(lista.getUsuario().getIdusuario())
                .nombreUsuario(lista.getUsuario().getNombre())
                .libros(libros)
                .build();
    }
}
