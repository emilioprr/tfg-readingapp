package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.RachaDTO;
import com.readingapp.reading_app.service.RachaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/racha")
@RequiredArgsConstructor
public class RachaController {

    private final RachaService rachaService;

    @GetMapping("/usuario/{idusuario}")
    public ResponseEntity<RachaDTO.Response> obtener(@PathVariable Long idusuario) {
        return ResponseEntity.ok(rachaService.calcular(idusuario));
    }
}