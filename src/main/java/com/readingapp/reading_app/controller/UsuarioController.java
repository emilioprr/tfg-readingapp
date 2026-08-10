package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.UsuarioDTO;
import com.readingapp.reading_app.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping("/registro")
    /*@valid comprueba las validaciones del DTO*/
    public ResponseEntity<UsuarioDTO.Response> registrar(@Valid @RequestBody UsuarioDTO.RegistroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.registrar(request));
    }

    /*dos peticiones similares, la primera para consultas rapidas y la segunda para la pagina del perfil con estadisticas completas*/
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTO.Response> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @GetMapping("/{id}/perfil")
    public ResponseEntity<UsuarioDTO.PerfilResponse> obtenerPerfil(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerPerfil(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO.Response> actualizar(@PathVariable Long id,
                                                          @RequestBody UsuarioDTO.UpdateRequest request) {
        return ResponseEntity.ok(usuarioService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{seguidorId}/seguir/{seguidoId}")
    public ResponseEntity<Void> seguirUsuario(@PathVariable Long seguidorId, @PathVariable Long seguidoId) {
        usuarioService.seguirUsuario(seguidorId, seguidoId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{seguidorId}/seguir/{seguidoId}")
    public ResponseEntity<Void> dejarDeSeguir(@PathVariable Long seguidorId, @PathVariable Long seguidoId) {
        usuarioService.dejarDeSeguirUsuario(seguidorId, seguidoId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/seguidos")
    public ResponseEntity<List<UsuarioDTO.Response>> obtenerSeguidos(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerSeguidos(id));
    }

    @GetMapping("/{id}/seguidores")
    public ResponseEntity<List<UsuarioDTO.Response>> obtenerSeguidores(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerSeguidores(id));
    }
}
