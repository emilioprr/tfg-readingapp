package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "participante_reto",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_reto", "id_usuario"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ParticipanteReto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idparticipante;

    @Builder.Default
    private Integer progreso = 0;

    /*Lo leído el día de la unión antes de unirse: los seguimientos solo guardan el día, así que se resta aparte.*/
    @Column(name = "progreso_inicial")
    @Builder.Default
    private Integer progresoInicial = 0;

    @Column(name = "reto_cumplido")
    @Builder.Default
    private Boolean retoCumplido = false;

    @Column(name = "fecha_union", nullable = false)
    private LocalDateTime fechaUnion;

    @Column(name = "fecha_cumplimiento")
    private LocalDateTime fechaCumplimiento;

    @ManyToOne
    @JoinColumn(name = "id_reto", nullable = false)
    private Reto reto;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;
}