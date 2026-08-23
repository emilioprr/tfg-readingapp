package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sesion_lectura")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SesionLectura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idsesion;

    @Column(nullable = false)
    private LocalDateTime inicio;

    private LocalDateTime fin;

    @Column(name = "duracion_minutos")
    private Integer duracionMinutos;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "id_libro", nullable = false)
    private Libro libro;
}

