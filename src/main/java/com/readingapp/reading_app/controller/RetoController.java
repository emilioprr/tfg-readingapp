package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.RetoDTO;
import com.readingapp.reading_app.service.RetoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retos")
@RequiredArgsConstructor
public class RetoController {

    private final RetoService retoService;

    @PostMapping
    public ResponseEntity<RetoDTO.Response> crear(@Valid @RequestBody RetoDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(retoService.crear(request));
    }

    @GetMapping("/activo/{idusuario}")
    public ResponseEntity<RetoDTO.Response> obtenerActivo(@PathVariable Long idusuario) {
        return ResponseEntity.ok(retoService.obtenerActivo(idusuario));
    }

    @GetMapping("/historial/{idusuario}")
    public ResponseEntity<List<RetoDTO.Response>> obtenerHistorial(@PathVariable Long idusuario) {
        return ResponseEntity.ok(retoService.obtenerHistorial(idusuario));
    }

    @PutMapping("/{id}/cumplido")
    public ResponseEntity<RetoDTO.Response> marcarCumplido(@PathVariable Long id) {
        return ResponseEntity.ok(retoService.marcarCumplido(id));
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Void> cancelar(@PathVariable Long id) {
        retoService.cancelar(id);
        return ResponseEntity.ok().build();
    }
}
