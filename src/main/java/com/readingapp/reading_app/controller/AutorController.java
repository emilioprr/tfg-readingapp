package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.AutorDTO;
import com.readingapp.reading_app.service.AutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/autores")
@RequiredArgsConstructor
public class AutorController {

    private final AutorService autorService;

    @PostMapping
    public ResponseEntity<AutorDTO.Response> crear(@Valid @RequestBody AutorDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(autorService.crear(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AutorDTO.Response> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(autorService.obtenerPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<AutorDTO.Response>> obtenerTodos() {
        return ResponseEntity.ok(autorService.obtenerTodos());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<AutorDTO.Response>> buscarPorNombre(@RequestParam String nombre) {
        return ResponseEntity.ok(autorService.buscarPorNombre(nombre));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AutorDTO.Response> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody AutorDTO.CreateRequest request) {
        return ResponseEntity.ok(autorService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        autorService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{autorId}/seguir/{usuarioId}")
    public ResponseEntity<Void> seguirAutor(@PathVariable Long autorId, @PathVariable Long usuarioId) {
        autorService.seguirAutor(usuarioId, autorId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{autorId}/seguir/{usuarioId}")
    public ResponseEntity<Void> dejarDeSeguirAutor(@PathVariable Long autorId, @PathVariable Long usuarioId) {
        autorService.dejarDeSeguirAutor(usuarioId, autorId);
        return ResponseEntity.noContent().build();
    }
}
