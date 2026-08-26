package com.readingapp.reading_app.model;

import com.readingapp.reading_app.model.enums.ModalidadReto;
import com.readingapp.reading_app.model.enums.TipoReto;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reto")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idreto;

    @Column(nullable = false)
    private String titulo;

    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoReto tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModalidadReto modalidad;

    @Column(nullable = false)
    private Integer meta;

    @Column(name = "fechainicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fechafin", nullable = false)
    private LocalDate fechaFin;

    @ManyToOne
    @JoinColumn(name = "id_creador")
    private Usuario creador; // null en PREDEFINIDO y COLABORATIVO

    @ManyToOne
    @JoinColumn(name = "id_autor")
    private Autor autor; // solo para LIBROS_AUTOR

    @OneToMany(mappedBy = "reto", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ParticipanteReto> participantes = new ArrayList<>();
}
