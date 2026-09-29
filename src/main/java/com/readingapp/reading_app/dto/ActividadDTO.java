package com.readingapp.reading_app.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

public class ActividadDTO {

    public enum Tipo { EMPEZO, TERMINO, QUIERE_LEER, RESENA, RETO_CONSEGUIDO }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    /*Un evento del feed: "Luis ha empezado a leer Las ratas", "Ana ha conseguido el reto…".*/
    public static class Response {
        private Tipo tipo;
        private String fecha;          // yyyy-MM-dd'T'HH:mm (los seguimientos solo tienen día)
        private Long idusuario;
        private String nombreUsuario;
        private String avatarUsuario;
        // Libro (empezar, terminar, quiero leer, reseña)
        private Long idlibro;
        private String tituloLibro;
        private String portadaLibro;
        private String nombreAutor;
        // Reseña
        private Long idresena;
        private BigDecimal puntuacion;
        // Reto
        private Long idreto;
        private String tituloReto;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Pagina {
        private List<Response> eventos;
        private Integer pagina;
        private Boolean hayMas;
    }
}
