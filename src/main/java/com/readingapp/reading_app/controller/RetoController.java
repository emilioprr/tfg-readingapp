package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.RetoDTO;
import com.readingapp.reading_app.model.enums.ModalidadReto;
import com.readingapp.reading_app.service.RetoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/retos")
@RequiredArgsConstructor
public class RetoController {

    private final RetoService retoService;

    @PostMapping
    public ResponseEntity<RetoDTO.Response> crear(@Valid @RequestBody RetoDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(retoService.crear(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RetoDTO.Response> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(retoService.obtenerPorId(id));
    }

    @GetMapping("/disponibles")
    public ResponseEntity<Page<RetoDTO.Response>> listarDisponibles(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(retoService.obtenerDisponibles(pageable));
    }

    @GetMapping("/predefinidos")
    public ResponseEntity<Page<RetoDTO.Response>> listarPredefinidos(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(retoService.obtenerPorModalidad(ModalidadReto.PREDEFINIDO, pageable));
    }

    @GetMapping("/compartidos")
    public ResponseEntity<Page<RetoDTO.Response>> listarCompartidos(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(retoService.obtenerPorModalidad(ModalidadReto.COMPARTIDO, pageable));
    }

    @GetMapping("/colaborativos")
    public ResponseEntity<Page<RetoDTO.Response>> listarColaborativos(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(retoService.obtenerPorModalidad(ModalidadReto.COLABORATIVO, pageable));
    }

    @GetMapping("/usuario/{idusuario}")
    public ResponseEntity<Page<RetoDTO.Response>> listarCreadosPorUsuario(
            @PathVariable Long idusuario, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(retoService.obtenerCreadosPorUsuario(idusuario, pageable));
    }

    @GetMapping("/usuario/{idusuario}/activos")
    public ResponseEntity<Page<RetoDTO.ParticipanteResponse>> listarActivos(
            @PathVariable Long idusuario, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(retoService.obtenerRetosActivos(idusuario, pageable));
    }

    @GetMapping("/usuario/{idusuario}/logros")
    public ResponseEntity<Page<RetoDTO.LogroResponse>> listarLogros(
            @PathVariable Long idusuario, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(retoService.obtenerLogros(idusuario, pageable));
    }

    @PostMapping("/{id}/unirse")
    public ResponseEntity<RetoDTO.ParticipanteResponse> unirse(
            @PathVariable Long id, @RequestParam Long usuarioId) {
        return ResponseEntity.ok(retoService.unirse(id, usuarioId));
    }

    @PutMapping("/{id}/progreso")
    public ResponseEntity<RetoDTO.ParticipanteResponse> recalcularProgreso(
            @PathVariable Long id, @RequestParam Long usuarioId) {
        return ResponseEntity.ok(retoService.recalcularProgreso(id, usuarioId));
    }

    @DeleteMapping("/{id}/abandonar")
    public ResponseEntity<Void> abandonar(@PathVariable Long id, @RequestParam Long usuarioId) {
        retoService.abandonar(id, usuarioId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, @RequestParam Long usuarioId) {
        retoService.eliminar(id, usuarioId);
        return ResponseEntity.noContent().build();
    }
}

