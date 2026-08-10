package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recomendacion")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Recomendacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idrecomendacion;

    @Column(columnDefinition = "TEXT")
    private String mensaje;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column
    private Boolean visto = false;

    @Column(name = "es_automatica")
    private Boolean esAutomatica = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario_emisor")
    private Usuario emisor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario_receptor", nullable = false)
    private Usuario receptor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idlibro", nullable = false)
    private Libro libro;
}
