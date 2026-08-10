package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.ListaDTO;
import com.readingapp.reading_app.service.ListaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listas")
@RequiredArgsConstructor
public class ListaController {

    private final ListaService listaService;

    @PostMapping("/usuario/{usuarioId}")
    public ResponseEntity<ListaDTO.Response> crear(@PathVariable Long usuarioId,
                                                   @Valid @RequestBody ListaDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(listaService.crear(usuarioId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListaDTO.DetalleResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(listaService.obtenerPorId(id));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<ListaDTO.Response>> obtenerPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(listaService.obtenerPorUsuario(usuarioId));
    }

    @GetMapping("/publicas")
    public ResponseEntity<List<ListaDTO.Response>> obtenerPublicas() {
        return ResponseEntity.ok(listaService.obtenerPublicas());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ListaDTO.Response> actualizar(@PathVariable Long id,
                                                        @RequestBody ListaDTO.UpdateRequest request) {
        return ResponseEntity.ok(listaService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        listaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // === LIBROS EN LISTA ===

    @PostMapping("/{listaId}/libros/{libroId}")
    public ResponseEntity<Void> agregarLibro(@PathVariable Long listaId, @PathVariable Long libroId) {
        listaService.agregarLibro(listaId, libroId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{listaId}/libros/{libroId}")
    public ResponseEntity<Void> quitarLibro(@PathVariable Long listaId, @PathVariable Long libroId) {
        listaService.quitarLibro(listaId, libroId);
        return ResponseEntity.noContent().build();
    }
}
