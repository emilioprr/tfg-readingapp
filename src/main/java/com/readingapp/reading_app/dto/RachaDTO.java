package com.readingapp.reading_app.dto;

import lombok.*;
import java.util.List;

public class RachaDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Integer racha;
        private Boolean hoyCompletado;
        private Integer mejorRacha;
        private Integer protectores;
        private Boolean nuevoProtector;
        private List<Integer> insignias;
        private List<DiaSemana> semana;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DiaSemana {
        private String fecha;
        private String letra;
        private String estado;   // LEIDO, PROTEGIDO, PENDIENTE, VACIO, FUTURO
        private Boolean esHoy;
    }
}