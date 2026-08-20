package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.UsuarioDTO;
import com.readingapp.reading_app.model.Lista;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.ListaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final ListaRepository listaRepository;
    private final NotificacionService notificacionService;

    @Transactional
    public UsuarioDTO.Response registrar(UsuarioDTO.RegistroRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fechaAlta(LocalDate.now())
                .seguidores(0)
                .build();

        usuario = usuarioRepository.save(usuario);

        Lista wishlist = Lista.builder()
                .nombre("Wishlist")
                .descripcion("Libros que quiero leer")
                .esPublica(false)
                .esAutomatica(true)
                .fechaCreacion(java.time.LocalDateTime.now())
                .usuario(usuario)
                .build();
        listaRepository.save(wishlist);

        return toResponse(usuario);
    }

    public UsuarioDTO.Response obtenerPorId(Long id) {
        Usuario usuario = buscarPorId(id);
        return toResponse(usuario);
    }

    public UsuarioDTO.PerfilResponse obtenerPerfil(Long id) {
        Usuario usuario = buscarPorId(id);
        return UsuarioDTO.PerfilResponse.builder()
                .idusuario(usuario.getIdusuario())
                .nombre(usuario.getNombre())
                .biografia(usuario.getBiografia())
                .avatar(usuario.getAvatar())
                .seguidores(usuario.getSeguidoresList() != null ? usuario.getSeguidoresList().size() : 0)
                .seguidos(usuario.getSeguidos() != null ? usuario.getSeguidos().size() : 0)
                .librosLeidos(usuario.getResenas() != null ? usuario.getResenas().size() : 0)
                .resenasEscritas(usuario.getResenas() != null ? usuario.getResenas().size() : 0)
                .build();
    }

    @Transactional
    public UsuarioDTO.Response actualizar(Long id, UsuarioDTO.UpdateRequest request) {
        Usuario usuario = buscarPorId(id);

        if (request.getNombre() != null) usuario.setNombre(request.getNombre());
        if (request.getBiografia() != null) usuario.setBiografia(request.getBiografia());
        if (request.getAvatar() != null) usuario.setAvatar(request.getAvatar());

        usuario = usuarioRepository.save(usuario);
        return toResponse(usuario);
    }

    @Transactional
    public void seguirUsuario(Long seguidorId, Long seguidoId) {
        if (seguidorId.equals(seguidoId)) {
            throw new IllegalArgumentException("No puedes seguirte a ti mismo");
        }
        Usuario seguidor = buscarPorId(seguidorId);
        Usuario seguido = buscarPorId(seguidoId);
        seguidor.getSeguidos().add(seguido);
        seguido.setSeguidores(seguido.getSeguidores() + 1);
        usuarioRepository.save(seguidor);
        usuarioRepository.save(seguido);
        notificacionService.crearNotificacionSeguidor(seguido, seguidor);
    }

    @Transactional
    public void dejarDeSeguirUsuario(Long seguidorId, Long seguidoId) {
        Usuario seguidor = buscarPorId(seguidorId);
        Usuario seguido = buscarPorId(seguidoId);
        seguidor.getSeguidos().remove(seguido);
        seguido.setSeguidores(Math.max(0, seguido.getSeguidores() - 1));
        usuarioRepository.save(seguidor);
        usuarioRepository.save(seguido);
    }

    public List<UsuarioDTO.Response> obtenerSeguidos(Long id) {
        Usuario usuario = buscarPorId(id);
        return usuario.getSeguidos().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<UsuarioDTO.Response> obtenerSeguidores(Long id) {
        Usuario usuario = buscarPorId(id);
        return usuario.getSeguidoresList().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void eliminar(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new EntityNotFoundException("Usuario no encontrado");
        }
        usuarioRepository.deleteById(id);
    }

    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con id: " + id));
    }

    private UsuarioDTO.Response toResponse(Usuario usuario) {
        return UsuarioDTO.Response.builder()
                .idusuario(usuario.getIdusuario())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .biografia(usuario.getBiografia())
                .avatar(usuario.getAvatar())
                .fechaAlta(usuario.getFechaAlta() != null ? usuario.getFechaAlta().toString() : null)
                .seguidores(usuario.getSeguidores())
                .build();
    }
}

