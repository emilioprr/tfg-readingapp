package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Puntuación de un libro sin reseña, dada desde su ficha. Cuenta para la nota media como una reseña más.
 * Si el usuario escribe después una reseña del libro, la nota pasa a la reseña y esta valoración se borra.
 */
@Entity
@Table(name = "valoracion",
        uniqueConstraints = @UniqueConstraint(columnNames = {"idusuario", "idlibro"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Valoracion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idvaloracion;

    @Column(nullable = false, precision = 2, scale = 1)
    private BigDecimal puntuacion;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idlibro", nullable = false)
    private Libro libro;
}
