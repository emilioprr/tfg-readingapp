package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.NotificacionDTO;
import com.readingapp.reading_app.model.enums.TipoNotificacion;
import com.readingapp.reading_app.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping("/usuario/{idusuario}")
    public ResponseEntity<List<NotificacionDTO.Response>> obtenerTodas(@PathVariable Long idusuario) {
        return ResponseEntity.ok(notificacionService.obtenerTodas(idusuario));
    }

    @GetMapping("/usuario/{idusuario}/no-leidas")
    public ResponseEntity<List<NotificacionDTO.Response>> obtenerNoLeidas(@PathVariable Long idusuario) {
        return ResponseEntity.ok(notificacionService.obtenerNoLeidas(idusuario));
    }

    @GetMapping("/usuario/{idusuario}/tipo/{tipo}")
    public ResponseEntity<List<NotificacionDTO.Response>> obtenerPorTipo(@PathVariable Long idusuario,
                                                                         @PathVariable TipoNotificacion tipo) {
        return ResponseEntity.ok(notificacionService.obtenerPorTipo(idusuario, tipo));
    }

    @GetMapping("/usuario/{idusuario}/contador")
    public ResponseEntity<NotificacionDTO.ContadorResponse> contarNoLeidas(@PathVariable Long idusuario) {
        return ResponseEntity.ok(notificacionService.contarNoLeidas(idusuario));
    }

    @PutMapping("/{id}/leida")
    public ResponseEntity<Void> marcarLeida(@PathVariable Long id) {
        notificacionService.marcarLeida(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/usuario/{idusuario}/leer-todas")
    public ResponseEntity<Void> marcarTodasLeidas(@PathVariable Long idusuario) {
        notificacionService.marcarTodasLeidas(idusuario);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        notificacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
