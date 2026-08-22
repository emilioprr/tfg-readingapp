package com.readingapp.reading_app.dto;

import com.readingapp.reading_app.model.enums.EtiquetaResena;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.Set;

public class ResenaDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private String texto;
        @DecimalMin(value = "0.5") @DecimalMax(value = "5.0")
        private BigDecimal puntuacion;
        @Min(1) @Max(3)
        private Integer ritmo;
        private Set<EtiquetaResena> etiquetas;
        private Boolean leidopreviamente;
        private Boolean esPublica;
        private Boolean tieneSpoiler;
        @NotNull(message = "El libro es obligatorio")
        private Long idlibro;
        @NotNull(message = "El usuario es obligatorio")
        private Long idusuario;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private String texto;
        @DecimalMin(value = "0.5") @DecimalMax(value = "5.0")
        private BigDecimal puntuacion;
        @Min(1) @Max(3)
        private Integer ritmo;
        private Set<EtiquetaResena> etiquetas;
        private Boolean esPublica;
        private Boolean tieneSpoiler;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idresena;
        private String texto;
        private BigDecimal puntuacion;
        private Integer ritmo;
        private Set<EtiquetaResena> etiquetas;
        private Boolean leidopreviamente;
        private Boolean esPublica;
        private Boolean tieneSpoiler;
        private String fechaCreacion;
        private Long idusuario;
        private String nombreUsuario;
        private Long idlibro;
        private String tituloLibro;
        private Integer numLikes;
    }
}