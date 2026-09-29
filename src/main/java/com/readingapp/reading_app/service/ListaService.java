package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
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
                .fechaCreacion(java.time.LocalDateTime.now())
                .usuario(usuario)
                .build();

        lista = listaRepository.save(lista);
        return toResponse(lista);
    }

    public ListaDTO.DetalleResponse obtenerPorId(Long id) {
        Lista lista = buscarPorId(id);
        if (!lista.getEsPublica()) {
            SecurityUtils.validarUsuarioOAdmin(lista.getUsuario().getIdusuario());
        }
        return toDetalleResponse(lista);
    }

    /*El propio usuario ve todas sus listas; los demás solo las públicas.*/
    public List<ListaDTO.Response> obtenerPorUsuario(Long usuarioId) {
        boolean esPropio = SecurityUtils.esUsuarioActual(usuarioId);
        return listaRepository.findByUsuarioIdusuario(usuarioId).stream()
                .filter(lista -> esPropio || lista.getEsPublica())
                .map(this::toResponse)
                .toList();
    }

    public List<ListaDTO.Response> obtenerPublicas() {
        return listaRepository.findByEsPublicaTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ListaDTO.Response actualizar(Long id, ListaDTO.UpdateRequest request) {
        Lista lista = listaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lista no encontrada con id: " + id));
        SecurityUtils.validarUsuario(lista.getUsuario().getIdusuario());
        if (request.getNombre() != null) lista.setNombre(request.getNombre());
        if (request.getDescripcion() != null) lista.setDescripcion(request.getDescripcion());
        if (request.getEsPublica() != null) lista.setEsPublica(request.getEsPublica());
        lista = listaRepository.save(lista);
        return toResponse(lista);
    }

    @Transactional
    public void eliminar(Long id) {
        Lista lista = listaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lista no encontrada con id: " + id));
        SecurityUtils.validarUsuarioOAdmin(lista.getUsuario().getIdusuario());
        listaRepository.deleteById(id);
    }

    // === GESTIÓN DE LIBROS EN LISTA ===

    @Transactional
    public void agregarLibro(Long idlista, Long idlibro) {
        Lista lista = listaRepository.findById(idlista)
                .orElseThrow(() -> new EntityNotFoundException("Lista no encontrada"));
        SecurityUtils.validarUsuario(lista.getUsuario().getIdusuario());
        Libro libro = libroRepository.findById(idlibro)
                .orElseThrow(() -> new EntityNotFoundException("Libro no encontrado"));
        lista.getLibros().add(libro);
        listaRepository.save(lista);
    }

    @Transactional
    public void quitarLibro(Long idlista, Long idlibro) {
        Lista lista = listaRepository.findById(idlista)
                .orElseThrow(() -> new EntityNotFoundException("Lista no encontrada"));
        SecurityUtils.validarUsuario(lista.getUsuario().getIdusuario());
        lista.getLibros().removeIf(l -> l.getIdlibro().equals(idlibro));
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
                .fechaCreacion(lista.getFechaCreacion() != null ? lista.getFechaCreacion().toString() : null)
                .idusuario(lista.getUsuario().getIdusuario())
                .nombreUsuario(lista.getUsuario().getNombre())
                .libros(libros)
                .build();
    }
}
