package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.ValoracionDTO;
import com.readingapp.reading_app.service.ValoracionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/valoraciones")
@RequiredArgsConstructor
public class ValoracionController {

    private final ValoracionService valoracionService;

    /*Tu puntuación sin reseña de un libro (204 si no lo has puntuado así).*/
    @GetMapping("/libro/{idlibro}/mia")
    public ResponseEntity<ValoracionDTO.Response> mia(@PathVariable Long idlibro) {
        return valoracionService.obtenerMia(idlibro)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/libro/{idlibro}")
    public ResponseEntity<ValoracionDTO.Response> valorar(@PathVariable Long idlibro,
                                                          @Valid @RequestBody ValoracionDTO.Request request) {
        return ResponseEntity.ok(valoracionService.valorar(idlibro, request.getPuntuacion()));
    }

    @DeleteMapping("/libro/{idlibro}")
    public ResponseEntity<Void> quitar(@PathVariable Long idlibro) {
        valoracionService.quitar(idlibro);
        return ResponseEntity.noContent().build();
    }
}
