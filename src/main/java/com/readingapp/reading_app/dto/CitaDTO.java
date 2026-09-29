package com.readingapp.reading_app.dto;

import lombok.*;

import java.util.List;

public class CitaDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    /*Una cita del muro: el texto, de qué libro es, quién la compartió y si la tienes guardada.*/
    public static class Response {
        private Long idanotacion;
        private String texto;
        private String parte;
        private Boolean tieneSpoiler;
        private String fecha;
        private Long idusuario;
        private String nombreUsuario;
        private String avatarUsuario;
        private Long idlibro;
        private String tituloLibro;
        private String portadaLibro;
        private String nombreAutor;
        private Boolean guardada;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Pagina {
        private List<Response> citas;
        private Integer pagina;
        private Boolean hayMas;
    }
}
