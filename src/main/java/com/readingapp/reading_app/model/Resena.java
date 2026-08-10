package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "resena")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idresena;

    @Column(columnDefinition = "TEXT")
    private String texto;

    @Column(precision = 3, scale = 1)
    private BigDecimal puntuacion;

    @Column(precision = 3, scale = 1)
    private BigDecimal puntestilo;

    @Column(precision = 3, scale = 1)
    private BigDecimal puntritmo;

    @Column(precision = 3, scale = 1)
    private BigDecimal puntpersonajes;

    @Column
    private Boolean leidopreviamente = false;

    @Column(name = "es_publica")
    private Boolean esPublica = true;

    @Column(name = "tiene_spoiler")
    private Boolean tieneSpoiler = false;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idlibro", nullable = false)
    private Libro libro;

    @ManyToMany(mappedBy = "resenasLikeadas")
    private Set<Usuario> likes = new HashSet<>();
}

