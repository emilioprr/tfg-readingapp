package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.LibroDTO;
import com.readingapp.reading_app.service.LibroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/libros")
@RequiredArgsConstructor
public class LibroController {

    private final LibroService libroService;

    @PostMapping
    public ResponseEntity<LibroDTO.Response> crear(@Valid @RequestBody LibroDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(libroService.crear(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LibroDTO.Response> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(libroService.obtenerPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<LibroDTO.Response>> obtenerTodos() {
        return ResponseEntity.ok(libroService.obtenerTodos());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<LibroDTO.Response>> buscarPorTitulo(@RequestParam String titulo) {
        return ResponseEntity.ok(libroService.buscarPorTitulo(titulo));
    }

    @GetMapping("/genero/{genero}")
    public ResponseEntity<List<LibroDTO.Response>> buscarPorGenero(@PathVariable String genero) {
        return ResponseEntity.ok(libroService.buscarPorGenero(genero));
    }

    @GetMapping("/autor/{idautor}")
    public ResponseEntity<List<LibroDTO.Response>> obtenerPorAutor(@PathVariable Long idautor) {
        return ResponseEntity.ok(libroService.obtenerPorAutor(idautor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LibroDTO.Response> actualizar(@PathVariable Long id,
                                                        @RequestBody LibroDTO.UpdateRequest request) {
        return ResponseEntity.ok(libroService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        libroService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // === FAVORITOS ===

    @PostMapping("/{libroId}/favorito/{usuarioId}")
    public ResponseEntity<Void> agregarFavorito(@PathVariable Long libroId, @PathVariable Long usuarioId) {
        libroService.agregarFavorito(usuarioId, libroId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{libroId}/favorito/{usuarioId}")
    public ResponseEntity<Void> quitarFavorito(@PathVariable Long libroId, @PathVariable Long usuarioId) {
        libroService.quitarFavorito(usuarioId, libroId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/favoritos/{usuarioId}")
    public ResponseEntity<List<LibroDTO.Response>> obtenerFavoritos(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(libroService.obtenerFavoritos(usuarioId));
    }
}
