package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.RecomendacionDTO;
import com.readingapp.reading_app.service.RecomendacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recomendaciones")
@RequiredArgsConstructor
public class RecomendacionController {

    private final RecomendacionService recomendacionService;

    @PostMapping
    public ResponseEntity<RecomendacionDTO.Response> crear(@Valid @RequestBody RecomendacionDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recomendacionService.crear(request));
    }

    @GetMapping("/recibidas/{idusuario}")
    public ResponseEntity<List<RecomendacionDTO.Response>> obtenerRecibidas(@PathVariable Long idusuario) {
        return ResponseEntity.ok(recomendacionService.obtenerRecibidas(idusuario));
    }

    @GetMapping("/enviadas/{idusuario}")
    public ResponseEntity<List<RecomendacionDTO.Response>> obtenerEnviadas(@PathVariable Long idusuario) {
        return ResponseEntity.ok(recomendacionService.obtenerEnviadas(idusuario));
    }

    @GetMapping("/no-vistas/{idusuario}")
    public ResponseEntity<List<RecomendacionDTO.Response>> obtenerNoVistas(@PathVariable Long idusuario) {
        return ResponseEntity.ok(recomendacionService.obtenerNoVistas(idusuario));
    }

    @PutMapping("/{id}/vista")
    public ResponseEntity<Void> marcarVista(@PathVariable Long id) {
        recomendacionService.marcarVista(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        recomendacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
