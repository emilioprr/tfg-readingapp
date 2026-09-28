package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.UsuarioDTO;
import com.readingapp.reading_app.model.Lista;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.repository.ListaRepository;
import com.readingapp.reading_app.repository.ResenaRepository;
import com.readingapp.reading_app.repository.SeguimientoRepository;
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
    private final NotificacionService notificacionService;
    private final SeguimientoRepository seguimientoRepository;
    private final ResenaRepository resenaRepository;

    @Transactional
    public UsuarioDTO.Response registrar(UsuarioDTO.RegistroRequest request) {
        if (request.getNombre().contains(" ")) {
            throw new IllegalArgumentException("El nombre no puede contener espacios");
        }

        if (usuarioRepository.existsByNombre(request.getNombre())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese nombre");
        }

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

        return toResponse(usuario);
    }

    public UsuarioDTO.Response obtenerPorId(Long id) {
        Usuario usuario = buscarPorId(id);
        return toResponse(usuario);
    }

    /*Estadísticas del perfil. Las reseñas privadas solo cuentan para el propio usuario.*/
    public UsuarioDTO.PerfilResponse obtenerPerfil(Long id) {
        Usuario usuario = buscarPorId(id);
        long resenas = SecurityUtils.esUsuarioActual(id)
                ? resenaRepository.countByUsuarioIdusuario(id)
                : resenaRepository.countByUsuarioIdusuarioAndEsPublicaTrue(id);

        return UsuarioDTO.PerfilResponse.builder()
                .idusuario(usuario.getIdusuario())
                .nombre(usuario.getNombre())
                .biografia(usuario.getBiografia())
                .avatar(usuario.getAvatar())
                .librosLeidos(seguimientoRepository.countByUsuarioIdusuarioAndEstado(id, EstadoLectura.LEIDO))
                .paginasLeidas(seguimientoRepository.sumPaginasByUsuario(id))
                .resenasEscritas(resenas)
                .build();
    }

    @Transactional
    public UsuarioDTO.Response actualizar(Long id, UsuarioDTO.UpdateRequest request) {
        Usuario usuario = buscarPorId(id);

        if (request.getNombre() != null) {
            if (request.getNombre().contains(" ")) {
                throw new IllegalArgumentException("El nombre no puede contener espacios");
            }
            if (!request.getNombre().equals(usuario.getNombre()) && usuarioRepository.existsByNombre(request.getNombre())) {
                throw new IllegalArgumentException("Ya existe un usuario con ese nombre");
            }
            usuario.setNombre(request.getNombre());
        }
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

        if (seguidor.getSeguidos().contains(seguido)) {
            throw new IllegalArgumentException("Ya sigues a este usuario");
        }

        seguidor.getSeguidos().add(seguido);
        seguido.setSeguidores(seguido.getSeguidores() + 1);
        usuarioRepository.save(seguidor);
        usuarioRepository.save(seguido);
        notificacionService.crearNotificacionSeguidor(seguido, seguidor);
    }

    public List<UsuarioDTO.Response> buscarPorNombre(String nombre) {
        return usuarioRepository.findByNombreContainingIgnoreCase(nombre).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void dejarDeSeguirUsuario(Long seguidorId, Long seguidoId) {
        Usuario seguidor = buscarPorId(seguidorId);
        Usuario seguido = buscarPorId(seguidoId);

        if (!seguidor.getSeguidos().contains(seguido)) {
            throw new IllegalArgumentException("No sigues a este usuario");
        }

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
                .biografia(usuario.getBiografia())
                .avatar(usuario.getAvatar())
                .fechaAlta(usuario.getFechaAlta() != null ? usuario.getFechaAlta().toString() : null)
                .seguidores(usuario.getSeguidores())
                .build();
    }
}

