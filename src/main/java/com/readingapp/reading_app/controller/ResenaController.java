package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.ResenaDTO;
import com.readingapp.reading_app.service.ResenaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resenas")
@RequiredArgsConstructor
public class ResenaController {

    private final ResenaService resenaService;

    @PostMapping
    public ResponseEntity<ResenaDTO.Response> crear(@Valid @RequestBody ResenaDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resenaService.crear(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResenaDTO.Response> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(resenaService.obtenerPorId(id));
    }

    @GetMapping("/usuario/{idusuario}")
    public ResponseEntity<Page<ResenaDTO.Response>> obtenerPorUsuario(@PathVariable Long idusuario, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(resenaService.obtenerPorUsuario(idusuario,  pageable));
    }

    @GetMapping("/libro/{idlibro}")
    public ResponseEntity<Page<ResenaDTO.Response>> obtenerPorLibro(@PathVariable Long idlibro, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(resenaService.obtenerPorLibro(idlibro,   pageable));
    }

    @GetMapping("/publicas")
    public ResponseEntity<Page<ResenaDTO.Response>> obtenerPublicas(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(resenaService.obtenerPublicas(pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResenaDTO.Response> actualizar(@PathVariable Long id,
                                                         @RequestBody ResenaDTO.UpdateRequest request) {
        return ResponseEntity.ok(resenaService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        resenaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // === LIKES ===

    @PostMapping("/{resenaId}/like/{usuarioId}")
    public ResponseEntity<Void> darLike(@PathVariable Long resenaId, @PathVariable Long usuarioId) {
        resenaService.darLike(resenaId, usuarioId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{resenaId}/like/{usuarioId}")
    public ResponseEntity<Void> quitarLike(@PathVariable Long resenaId, @PathVariable Long usuarioId) {
        resenaService.quitarLike(resenaId, usuarioId);
        return ResponseEntity.noContent().build();
    }
}
