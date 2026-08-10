package com.readingapp.reading_app.dto;

import com.readingapp.reading_app.model.enums.TipoNotificacion;
import lombok.*;

public class NotificacionDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idnotificacion;
        private TipoNotificacion tipo;
        private String mensaje;
        private String fecha;
        private Boolean leida;
        private Long idusuario;
        private Long idresena;
        private Long idrecomendacion;
        private Long idusuarioOrigen;
        private String nombreUsuarioOrigen;
        private Long idlibro;
        private String tituloLibro;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ContadorResponse {
        private Long idusuario;
        private Long noLeidas;
    }
}
