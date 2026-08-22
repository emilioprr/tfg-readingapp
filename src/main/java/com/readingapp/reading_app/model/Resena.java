package com.readingapp.reading_app.model;

import com.readingapp.reading_app.model.enums.EtiquetaResena;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "resena")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idresena;

    @Column(columnDefinition = "TEXT")
    private String texto;

    @Column(precision = 2, scale = 1)
    private BigDecimal puntuacion;

    private Integer ritmo;

    @Builder.Default
    private Boolean leidopreviamente = false;

    @Column(name = "es_publica")
    @Builder.Default
    private Boolean esPublica = true;

    @Column(name = "tiene_spoiler")
    @Builder.Default
    private Boolean tieneSpoiler = false;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @ManyToOne
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "idlibro", nullable = false)
    private Libro libro;

    @ManyToMany(mappedBy = "resenasLikeadas")
    @Builder.Default
    private Set<Usuario> likes = new HashSet<>();

    @ElementCollection(targetClass = EtiquetaResena.class)
    @CollectionTable(name = "resena_etiqueta", joinColumns = @JoinColumn(name = "idresena"))
    @Column(name = "etiqueta")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<EtiquetaResena> etiquetas = new HashSet<>();
}


