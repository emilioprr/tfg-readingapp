package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.AutorDTO;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AutorService {

    private final AutorRepository autorRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public AutorDTO.Response crear(AutorDTO.CreateRequest request) {
        Autor autor = Autor.builder()
                .nombre(request.getNombre())
                .biografia(request.getBiografia())
                .foto(request.getFoto())
                .nacionalidad(request.getNacionalidad())
                .build();

        autor = autorRepository.save(autor);
        return toResponse(autor);
    }

    public AutorDTO.Response obtenerPorId(Long id) {
        Autor autor = buscarPorId(id);
        return toResponse(autor);
    }

    public List<AutorDTO.Response> buscarPorNombre(String nombre) {
        return autorRepository.findByNombreContainingIgnoreCase(nombre).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AutorDTO.Response> obtenerTodos() {
        return autorRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AutorDTO.Response actualizar(Long id, AutorDTO.CreateRequest request) {
        Autor autor = buscarPorId(id);

        if (request.getNombre() != null) autor.setNombre(request.getNombre());
        if (request.getBiografia() != null) autor.setBiografia(request.getBiografia());
        if (request.getFoto() != null) autor.setFoto(request.getFoto());
        if (request.getNacionalidad() != null) autor.setNacionalidad(request.getNacionalidad());

        autor = autorRepository.save(autor);
        return toResponse(autor);
    }

    @Transactional
    public void seguirAutor(Long autorId, Long usuarioId) {
        Autor autor = buscarPorId(autorId);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        usuario.getAutoresSeguidos().add(autor);
        autor.setSeguidores(autor.getSeguidores() + 1);
        usuarioRepository.save(usuario);
        autorRepository.save(autor);
    }

    @Transactional
    public void dejarDeSeguirAutor(Long autorId, Long usuarioId) {
        Autor autor = buscarPorId(autorId);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        usuario.getAutoresSeguidos().remove(autor);
        autor.setSeguidores(Math.max(0, autor.getSeguidores() - 1));
        usuarioRepository.save(usuario);
        autorRepository.save(autor);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!autorRepository.existsById(id)) {
            throw new EntityNotFoundException("Autor no encontrado");
        }
        autorRepository.deleteById(id);
    }

    public Autor buscarPorId(Long id) {
        return autorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Autor no encontrado con id: " + id));
    }

    private AutorDTO.Response toResponse(Autor autor) {
        return AutorDTO.Response.builder()
                .idautor(autor.getIdautor())
                .nombre(autor.getNombre())
                .biografia(autor.getBiografia())
                .foto(autor.getFoto())
                .nacionalidad(autor.getNacionalidad())
                .seguidores(autor.getSeguidores())
                .numLibros(autor.getLibros() != null ? autor.getLibros().size() : 0)
                .build();
    }
}

