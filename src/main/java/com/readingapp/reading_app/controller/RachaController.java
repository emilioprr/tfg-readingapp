package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.config.SecurityUtils;
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

    /*Consultar la racha de cualquier usuario (p. ej. en su perfil): no modifica nada.*/
    @GetMapping("/usuario/{idusuario}")
    public ResponseEntity<RachaDTO.Response> obtener(@PathVariable Long idusuario) {
        return ResponseEntity.ok(rachaService.consultar(idusuario));
    }

    /*Recalcular y guardar la racha propia (gasta/concede protectores, actualiza el récord).*/
    @PostMapping("/usuario/{idusuario}/actualizar")
    public ResponseEntity<RachaDTO.Response> actualizar(@PathVariable Long idusuario) {
        SecurityUtils.validarUsuario(idusuario);
        return ResponseEntity.ok(rachaService.actualizar(idusuario));
    }
}