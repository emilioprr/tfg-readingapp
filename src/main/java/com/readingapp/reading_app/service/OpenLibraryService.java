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

    private static final String SEARCH_URL = "https://openlibrary.org/search/authors.json?q={nombre}&limit=1";
    private static final String AUTHOR_URL = "https://openlibrary.org/authors/{key}.json";
    private static final String PHOTO_URL = "https://covers.openlibrary.org/a/olid/{key}-L.jpg";

    @Transactional
    public boolean enriquecerAutor(Long idautor) {
        Autor autor = autorRepository.findById(idautor).orElse(null);
        if (autor == null) return false;
        return buscarYActualizar(autor);
    }

    @Transactional
    public int enriquecerAutoresIncompletos() {
        List<Autor> autores = autorRepository.findAll().stream()
                .filter(a -> a.getBiografia() == null && a.getFoto() == null)
                .toList();

        int enriquecidos = 0;
        for (Autor autor : autores) {
            try {
                if (buscarYActualizar(autor)) {
                    enriquecidos++;
                }
                Thread.sleep(1000);
            } catch (Exception e) {
                log.warn("Error al enriquecer autor '{}': {}", autor.getNombre(), e.getMessage());
            }
        }

        log.info("Enriquecimiento completado: {}/{} autores actualizados", enriquecidos, autores.size());
        return enriquecidos;
    }

    private boolean buscarYActualizar(Autor autor) {
        try {
            Map<String, Object> searchResponse = restTemplate.getForObject(
                    SEARCH_URL, Map.class, autor.getNombre()
            );

            if (searchResponse == null || (int) searchResponse.getOrDefault("numFound", 0) == 0) {
                return false;
            }

            List<Map<String, Object>> docs = (List<Map<String, Object>>) searchResponse.get("docs");
            if (docs == null || docs.isEmpty()) return false;

            Map<String, Object> primerResultado = docs.get(0);
            String authorKey = (String) primerResultado.get("key");
            if (authorKey == null) return false;

            Map<String, Object> authorData = restTemplate.getForObject(
                    AUTHOR_URL, Map.class, authorKey
            );

            if (authorData == null) return false;

            if (autor.getBiografia() == null) {
                Object bio = authorData.get("bio");
                if (bio instanceof String) {
                    autor.setBiografia((String) bio);
                } else if (bio instanceof Map) {
                    autor.setBiografia((String) ((Map<String, Object>) bio).get("value"));
                }
            }

            if (autor.getFoto() == null) {
                List<Integer> photos = (List<Integer>) authorData.get("photos");
                if (photos != null && !photos.isEmpty()) {
                    autor.setFoto(PHOTO_URL.replace("{key}", authorKey));
                }
            }

            if (autor.getNacionalidad() == null) {
                Object birthPlace = authorData.get("birth_place");
                if (birthPlace instanceof String) {
                    autor.setNacionalidad((String) birthPlace);
                }
            }

            autorRepository.save(autor);
            log.info("Autor enriquecido: {}", autor.getNombre());
            return true;

        } catch (Exception e) {
            log.warn("No se pudo enriquecer al autor '{}': {}", autor.getNombre(), e.getMessage());
            return false;
        }
    }
}

