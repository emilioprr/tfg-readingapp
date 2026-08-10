package com.readingapp.reading_app.model;

import com.readingapp.reading_app.model.enums.TipoAnotacion;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "anotacion")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Anotacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idanotacion;

    @Column(columnDefinition = "TEXT")
    private String texto;

    @Column(length = 200)
    private String parte;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoAnotacion tipo = TipoAnotacion.NOTA;

    @Column(name = "es_publica")
    private Boolean esPublica = false;

    @Column(name = "tiene_spoiler")
    private Boolean tieneSpoiler = false;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idlibro", nullable = false)
    private Libro libro;
}

