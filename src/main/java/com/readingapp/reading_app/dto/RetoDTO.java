package com.readingapp.reading_app.dto;

import com.readingapp.reading_app.model.enums.ModalidadReto;
import com.readingapp.reading_app.model.enums.TipoReto;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

public class RetoDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        @NotBlank(message = "El título es obligatorio")
        private String titulo;
        private String descripcion;
        @NotNull(message = "El tipo es obligatorio")
        private TipoReto tipo;
        @NotNull(message = "La modalidad es obligatoria")
        private ModalidadReto modalidad;
        @NotNull @Min(1)
        private Integer meta;
        private LocalDate fechaInicio;
        @NotNull
        private LocalDate fechaFin;
        private Long idCreador;  // null para PREDEFINIDO/COLABORATIVO
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long idreto;
        private String titulo;
        private String descripcion;
        private TipoReto tipo;
        private ModalidadReto modalidad;
        private Integer meta;
        private String fechaInicio;
        private String fechaFin;
        private Long idCreador;
        private String nombreCreador;
        private Long idAutor;
        private String nombreAutor;
        private Integer numParticipantes;
        private Integer progresoColaborativo; // solo COLABORATIVO: suma total
        private Double porcentajeColaborativo;
        private List<ParticipanteResponse> participantes;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ParticipanteResponse {
        private Long idparticipante;
        private Long idreto;
        private String tituloReto;
        private TipoReto tipoReto;
        private ModalidadReto modalidadReto;
        private Integer meta;
        private Long idusuario;
        private String nombreUsuario;
        private Integer progreso;
        private Boolean retoCumplido;
        private String fechaUnion;
        private String fechaCumplimiento;
        private Double porcentaje;
    }
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LogroResponse {
        private Long idreto;
        private String tituloReto;
        private TipoReto tipo;
        private ModalidadReto modalidad;
        private Integer meta;
        private String fechaCumplimiento;
        private String nombreAutor;
    }
}
