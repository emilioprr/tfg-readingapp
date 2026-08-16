package com.readingapp.reading_app.config;

import com.readingapp.reading_app.service.OpenLibraryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class TareasProgramadasConfig {

    private final OpenLibraryService openLibraryService;

    /*Enriquece autores incompletos cada semana a traves de OpenLibrary (miércoles a las 4:00 AM).*/
    @Scheduled(cron = "0 0 4 * * WED")
    public void enriquecerAutores() {
        log.info("=== Iniciando enriquecimiento de autores ===");
        int enriquecidos = openLibraryService.enriquecerAutoresIncompletos();
        log.info("=== Enriquecimiento completado: {} autores actualizados ===", enriquecidos);
    }
}

