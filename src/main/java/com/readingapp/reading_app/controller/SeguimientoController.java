package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.SeguimientoDTO;
import com.readingapp.reading_app.model.enums.EstadoLectura;
import com.readingapp.reading_app.service.SeguimientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seguimientos")
@RequiredArgsConstructor
public class SeguimientoController {

    private final SeguimientoService seguimientoService;

    @PostMapping
    public ResponseEntity<SeguimientoDTO.Response> registrar(@Valid @RequestBody SeguimientoDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(seguimientoService.registrar(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SeguimientoDTO.Response> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(seguimientoService.obtenerPorId(id));
    }

    @GetMapping("/usuario/{idusuario}")
    public ResponseEntity<List<SeguimientoDTO.Response>> obtenerPorUsuario(@PathVariable Long idusuario) {
        return ResponseEntity.ok(seguimientoService.obtenerPorUsuario(idusuario));
    }

    @GetMapping("/usuario/{idusuario}/libro/{idlibro}")
    public ResponseEntity<List<SeguimientoDTO.Response>> obtenerHistorial(@PathVariable Long idusuario,
                                                                          @PathVariable Long idlibro) {
        return ResponseEntity.ok(seguimientoService.obtenerHistorialLibro(idusuario, idlibro));
    }

    @GetMapping("/usuario/{idusuario}/estado/{estado}")
    public ResponseEntity<List<SeguimientoDTO.Response>> obtenerPorEstado(@PathVariable Long idusuario,
                                                                          @PathVariable EstadoLectura estado) {
        return ResponseEntity.ok(seguimientoService.obtenerPorEstado(idusuario, estado));
    }

    @GetMapping("/usuario/{idusuario}/libro/{idlibro}/ultimo")
    public ResponseEntity<SeguimientoDTO.Response> obtenerUltimoProgreso(@PathVariable Long idusuario,
                                                                         @PathVariable Long idlibro) {
        return ResponseEntity.ok(seguimientoService.obtenerUltimoProgreso(idusuario, idlibro));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        seguimientoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
