package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.service.GoogleBooksService;
import com.readingapp.reading_app.service.OpenLibraryService;
import jakarta.persistence.EntityNotFoundException;
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
    private final AutorRepository autorRepository;

    @PostMapping("/categoria")
    public ResponseEntity<Map<String, Object>> importarCategoria(
            @RequestParam String query,
            @RequestParam(defaultValue = "40") int cantidad,
            @RequestParam(defaultValue = "es") String idioma) {

        SecurityUtils.validarAdmin();
        int importados = googleBooksService.importarPorCategoria(query, cantidad, idioma);
        return ResponseEntity.ok(Map.of("query", query, "importados", importados));
    }

    @PostMapping("/masiva")
    public ResponseEntity<Map<String, Integer>> importarMasiva(
            @RequestBody List<String> categorias,
            @RequestParam(defaultValue = "50") int cantidad,
            @RequestParam(defaultValue = "es") String idioma) {

        SecurityUtils.validarAdmin();
        Map<String, Integer> resultado = googleBooksService.importarMultiplesCategorias(categorias, cantidad, idioma);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/isbn")
    public ResponseEntity<Map<String, Object>> importarPorIsbn(@RequestParam String isbn) {
        SecurityUtils.validarAdmin();
        boolean importado = googleBooksService.importarPorIsbn(isbn);
        return ResponseEntity.ok(Map.of("isbn", isbn, "importado", importado));
    }

    @PostMapping("/autor/{id}/enriquecer")
    public ResponseEntity<Map<String, Object>> enriquecerAutor(@PathVariable Long id) {
        SecurityUtils.validarAdmin();
        Autor autor = autorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Autor no encontrado"));
        String fotoAntes = autor.getFoto();
        openLibraryService.enriquecerAutor(autor);
        boolean enriquecido = autor.getFoto() != null && !autor.getFoto().equals(fotoAntes);
        return ResponseEntity.ok(Map.of("idautor", id, "enriquecido", enriquecido));
    }

    @PostMapping("/autores/enriquecer")
    public ResponseEntity<Map<String, Object>> enriquecerTodos() {
        SecurityUtils.validarAdmin();
        int enriquecidos = openLibraryService.enriquecerAutoresIncompletos();
        return ResponseEntity.ok(Map.of("autoresEnriquecidos", enriquecidos));
    }

    @PostMapping("/populares")
    public ResponseEntity<Map<String, Object>> importarPopulares(
            @RequestParam(defaultValue = "200") int cantidad,
            @RequestParam(defaultValue = "es") String idioma) {
        int importados = googleBooksService.importarPopulares(cantidad, idioma);
        return ResponseEntity.ok(Map.of("importados", importados));
    }
}
