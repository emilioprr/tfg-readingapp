package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** Like de un usuario a una lista. Guarda la fecha por si se quieren ordenar las listas por populares. */
@Entity
@Table(name = "like_lista",
        uniqueConstraints = @UniqueConstraint(columnNames = {"idusuario", "idlista"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LikeLista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idlike;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idlista", nullable = false)
    private Lista lista;
}
