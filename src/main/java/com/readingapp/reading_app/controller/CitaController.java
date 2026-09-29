package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.CitaDTO;
import com.readingapp.reading_app.service.CitaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
public class CitaController {

    private final CitaService citaService;

    /*Citas públicas de la comunidad. orden = "populares" (más likes de la semana) o "recientes".*/
    @GetMapping
    public ResponseEntity<CitaDTO.Pagina> comunidad(@RequestParam(defaultValue = "populares") String orden,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(citaService.obtenerComunidad(orden, Math.max(page, 0), Math.min(Math.max(size, 1), 50)));
    }

    /*Citas guardadas por un usuario (pestaña "Citas" de su perfil).*/
    @GetMapping("/guardadas/usuario/{idusuario}")
    public ResponseEntity<CitaDTO.Pagina> guardadas(@PathVariable Long idusuario,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(citaService.obtenerGuardadas(idusuario, Math.max(page, 0), Math.min(Math.max(size, 1), 50)));
    }

    @PostMapping("/{id}/guardar")
    public ResponseEntity<Void> guardar(@PathVariable Long id) {
        citaService.guardar(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/guardar")
    public ResponseEntity<Void> quitar(@PathVariable Long id) {
        citaService.quitar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Void> darLike(@PathVariable Long id) {
        citaService.darLike(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<Void> quitarLike(@PathVariable Long id) {
        citaService.quitarLike(id);
        return ResponseEntity.noContent().build();
    }
}
