package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.SesionLecturaDTO;
import com.readingapp.reading_app.service.SesionLecturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sesiones-lectura")
@RequiredArgsConstructor
public class SesionLecturaController {

    private final SesionLecturaService sesionLecturaService;

    @PostMapping
    public ResponseEntity<SesionLecturaDTO.Response> registrar(
            @Valid @RequestBody SesionLecturaDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sesionLecturaService.registrar(request));
    }

    @GetMapping("/usuario/{idusuario}")
    public ResponseEntity<Page<SesionLecturaDTO.Response>> listarPorUsuario(
            @PathVariable Long idusuario, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(sesionLecturaService.obtenerPorUsuario(idusuario, pageable));
    }

    @GetMapping("/usuario/{idusuario}/resumen")
    public ResponseEntity<SesionLecturaDTO.ResumenResponse> resumen(@PathVariable Long idusuario) {
        return ResponseEntity.ok(sesionLecturaService.obtenerResumen(idusuario));
    }
}

