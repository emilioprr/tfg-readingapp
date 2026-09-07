package com.readingapp.reading_app.service;

import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.repository.AutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenLibraryService {

    private final RestTemplate restTemplate;
    private final AutorRepository autorRepository;

    private static final String AUTHOR_SEARCH_URL = "https://openlibrary.org/search/authors.json?q={query}&limit=1";
    private static final String AUTHOR_DETAIL_URL = "https://openlibrary.org/authors/{key}.json";
    private static final String AUTHOR_PHOTO_URL = "https://covers.openlibrary.org/a/olid/{key}-M.jpg";

    @Transactional
    public void enriquecerAutor(Autor autor) {
        try {
            Map<String, Object> response = restTemplate.getForObject(AUTHOR_SEARCH_URL, Map.class, autor.getNombre());
            if (response == null) return;

            List<Map<String, Object>> docs = (List<Map<String, Object>>) response.get("docs");
            if (docs == null || docs.isEmpty()) return;

            Map<String, Object> autorOL = docs.get(0);
            String key = (String) autorOL.get("key");
            if (key == null) return;

            // Foto
            String fotoUrl = AUTHOR_PHOTO_URL.replace("{key}", key);
            try {
                restTemplate.headForHeaders(fotoUrl);
                autor.setFoto(fotoUrl);
            } catch (Exception e) {
                // No tiene foto
            }

            // Biografía
            try {
                Map<String, Object> detalle = restTemplate.getForObject(AUTHOR_DETAIL_URL, Map.class, key);
                if (detalle != null) {
                    Object bio = detalle.get("bio");
                    if (bio instanceof String) {
                        autor.setBiografia((String) bio);
                    } else if (bio instanceof Map) {
                        autor.setBiografia((String) ((Map) bio).get("value"));
                    }
                }
            } catch (Exception e) {
                log.warn("No se pudo obtener detalle del autor {}: {}", autor.getNombre(), e.getMessage());
            }

            autorRepository.save(autor);
            Thread.sleep(200);
        } catch (Exception e) {
            log.warn("No se pudo enriquecer autor {}: {}", autor.getNombre(), e.getMessage());
        }
    }

    @Transactional
    public int enriquecerAutoresIncompletos() {
        List<Autor> sinFoto = autorRepository.findAll().stream()
                .filter(a -> a.getFoto() == null)
                .toList();
        int enriquecidos = 0;
        for (Autor autor : sinFoto) {
            enriquecerAutor(autor);
            if (autor.getFoto() != null) enriquecidos++;
        }
        log.info("Enriquecidos {} autores de {} sin foto", enriquecidos, sinFoto.size());
        return enriquecidos;
    }
}