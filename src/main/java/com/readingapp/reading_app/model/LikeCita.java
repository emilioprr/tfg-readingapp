package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** Like de un usuario a una cita. Guarda la fecha para poder ordenar el muro por las más likeadas de la semana. */
@Entity
@Table(name = "like_cita",
        uniqueConstraints = @UniqueConstraint(columnNames = {"idusuario", "idanotacion"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LikeCita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idlike;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idanotacion", nullable = false)
    private Anotacion anotacion;
}
