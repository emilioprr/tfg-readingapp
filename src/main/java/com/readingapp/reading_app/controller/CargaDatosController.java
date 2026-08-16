package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.service.GoogleBooksService;
import com.readingapp.reading_app.service.OpenLibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/carga")
@RequiredArgsConstructor
public class CargaDatosController {

    private final GoogleBooksService googleBooksService;
    private final OpenLibraryService openLibraryService;

    @PostMapping("/categoria")
    public ResponseEntity<Map<String, Object>> importarCategoria(
            @RequestParam String query,
            @RequestParam(defaultValue = "40") int cantidad,
            @RequestParam(defaultValue = "es") String idioma) {

        int importados = googleBooksService.importarPorCategoria(query, cantidad, idioma);
        return ResponseEntity.ok(Map.of("query", query, "importados", importados));
    }

    @PostMapping("/masiva")
    public ResponseEntity<Map<String, Integer>> importarMasiva(
            @RequestBody List<String> categorias,
            @RequestParam(defaultValue = "50") int cantidad,
            @RequestParam(defaultValue = "es") String idioma) {

        Map<String, Integer> resultado = googleBooksService.importarMultiplesCategorias(categorias, cantidad, idioma);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/isbn")
    public ResponseEntity<Map<String, Object>> importarPorIsbn(@RequestParam String isbn) {
        boolean importado = googleBooksService.importarPorIsbn(isbn);
        return ResponseEntity.ok(Map.of("isbn", isbn, "importado", importado));
    }

    @PostMapping("/autor/{id}/enriquecer")
    public ResponseEntity<Map<String, Object>> enriquecerAutor(@PathVariable Long id) {
        boolean enriquecido = openLibraryService.enriquecerAutor(id);
        return ResponseEntity.ok(Map.of("idautor", id, "enriquecido", enriquecido));
    }

    @PostMapping("/autores/enriquecer")
    public ResponseEntity<Map<String, Object>> enriquecerTodos() {
        int enriquecidos = openLibraryService.enriquecerAutoresIncompletos();
        return ResponseEntity.ok(Map.of("autoresEnriquecidos", enriquecidos));
    }
}
