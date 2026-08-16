package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.dto.AnotacionDTO;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import com.readingapp.reading_app.service.AnotacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/anotaciones")
@RequiredArgsConstructor
public class AnotacionController {

    private final AnotacionService anotacionService;

    @PostMapping
    public ResponseEntity<AnotacionDTO.Response> crear(@Valid @RequestBody AnotacionDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(anotacionService.crear(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnotacionDTO.Response> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(anotacionService.obtenerPorId(id));
    }

    @GetMapping("/usuario/{idusuario}")
    public ResponseEntity<List<AnotacionDTO.Response>> obtenerPorUsuario(@PathVariable Long idusuario, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(anotacionService.obtenerPorUsuario(idusuario, pageable));
    }

    @GetMapping("/libro/{idlibro}")
    public ResponseEntity<List<AnotacionDTO.Response>> obtenerPorLibro(@PathVariable Long idlibro, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(anotacionService.obtenerPorLibro(idlibro, pageable));
    }

    @GetMapping("/usuario/{idusuario}/libro/{idlibro}")
    public ResponseEntity<List<AnotacionDTO.Response>> obtenerPorUsuarioYLibro(@PathVariable Long idusuario,
                                                                               @PathVariable Long idlibro) {
        return ResponseEntity.ok(anotacionService.obtenerPorUsuarioYLibro(idusuario, idlibro));
    }

    @GetMapping("/usuario/{idusuario}/tipo/{tipo}")
    public ResponseEntity<List<AnotacionDTO.Response>> obtenerPorUsuarioYTipo(@PathVariable Long idusuario,
                                                                              @PathVariable TipoAnotacion tipo, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(anotacionService.obtenerPorUsuarioYTipo(idusuario, tipo, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnotacionDTO.Response> actualizar(@PathVariable Long id,
                                                            @RequestBody AnotacionDTO.UpdateRequest request) {
        return ResponseEntity.ok(anotacionService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        anotacionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
