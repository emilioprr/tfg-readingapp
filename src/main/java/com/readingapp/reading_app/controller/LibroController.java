package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.config.SecurityUtils;
import com.readingapp.reading_app.dto.CatalogoDTO;
import com.readingapp.reading_app.dto.LibroDTO;
import com.readingapp.reading_app.service.CatalogoService;
import com.readingapp.reading_app.service.GoogleBooksService;
import com.readingapp.reading_app.service.LibroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/libros")
@RequiredArgsConstructor
public class LibroController {

    private final LibroService libroService;
    private final GoogleBooksService googleBooksService;
    private final CatalogoService catalogoService;

    @PostMapping
    public ResponseEntity<LibroDTO.Response> crear(@Valid @RequestBody LibroDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(libroService.crear(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LibroDTO.Response> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(libroService.obtenerPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<LibroDTO.Response>> obtenerTodos( @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(libroService.obtenerTodos(pageable));
    }

    @GetMapping("/buscar")
    public ResponseEntity<Page<LibroDTO.Response>> buscarPorTitulo(@RequestParam String titulo, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(libroService.buscarPorTitulo(titulo, pageable));
    }

    @GetMapping("/genero/{genero}")
    public ResponseEntity<List<LibroDTO.Response>> buscarPorGenero(@PathVariable String genero, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(libroService.buscarPorGenero(genero, pageable));
    }

    @GetMapping("/autor/{idautor}")
    public ResponseEntity<List<LibroDTO.Response>> obtenerPorAutor(@PathVariable Long idautor, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(libroService.obtenerPorAutor(idautor, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LibroDTO.Response> actualizar(@PathVariable Long id,
                                                        @RequestBody LibroDTO.UpdateRequest request) {
        return ResponseEntity.ok(libroService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        libroService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    /*Catálogo completo: libro destacado, filas temáticas y por categoría (con libros aleatorios en cada visita).*/
    @GetMapping("/catalogo")
    public ResponseEntity<CatalogoDTO.Response> obtenerCatalogo() {
        return ResponseEntity.ok(catalogoService.obtenerCatalogo());
    }

    @GetMapping("/categoria/{slug}")
    public ResponseEntity<CatalogoDTO.PaginaCategoria> obtenerPorCategoria(@PathVariable String slug,
                                                                         @RequestParam(defaultValue = "0") int page,
                                                                         @RequestParam(defaultValue = "24") int size) {
        return ResponseEntity.ok(catalogoService.obtenerPorCategoria(slug, Math.max(page, 0), Math.min(Math.max(size, 1), 60)));
    }

    @GetMapping("/generos")
    public ResponseEntity<List<String>> obtenerGeneros() {
        return ResponseEntity.ok(libroService.obtenerGeneros());
    }

    @GetMapping("/populares")
    public ResponseEntity<List<LibroDTO.Response>> obtenerPopulares(@PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(libroService.obtenerPopulares(pageable));
    }

    @GetMapping("/populares-amigos/{idusuario}")
    public ResponseEntity<List<LibroDTO.Response>> obtenerPopularesEntreSeguidos(
            @PathVariable Long idusuario, @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(libroService.obtenerPopularesEntreSeguidos(idusuario, pageable));
    }

    @GetMapping("/buscar/google")
    public ResponseEntity<Map<String, Object>> buscarEnGoogle(
            @RequestParam String q,
            // Posición por la que sigue cada búsqueda; -1 si ya se agotó
            @RequestParam(defaultValue = "0") int titulo,
            @RequestParam(defaultValue = "0") int autor,
            @RequestParam(defaultValue = "0") int general) {
        return ResponseEntity.ok(googleBooksService.buscarEnGoogle(q, titulo, autor, general));
    }

    @PostMapping("/importar/google/{idExterno}")
    public ResponseEntity<Map<String, Long>> importarDesdeGoogle(@PathVariable String idExterno) {
        return ResponseEntity.ok(Map.of("idlibro", googleBooksService.importarPorIdExterno(idExterno)));
    }

    // === FAVORITOS ===

    @PostMapping("/{libroId}/favorito/{usuarioId}")
    public ResponseEntity<Void> agregarFavorito(@PathVariable Long libroId, @PathVariable Long usuarioId) {
        SecurityUtils.validarUsuario(usuarioId);
        libroService.agregarFavorito(usuarioId, libroId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{libroId}/favorito/{usuarioId}")
    public ResponseEntity<Void> quitarFavorito(@PathVariable Long libroId, @PathVariable Long usuarioId) {
        SecurityUtils.validarUsuario(usuarioId);
        libroService.quitarFavorito(usuarioId, libroId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/favoritos/{usuarioId}")
    public ResponseEntity<List<LibroDTO.Response>> obtenerFavoritos(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(libroService.obtenerFavoritos(usuarioId));
    }
}
