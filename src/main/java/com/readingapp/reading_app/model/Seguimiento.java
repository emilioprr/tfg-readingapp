package com.readingapp.reading_app.model;

import com.readingapp.reading_app.model.enums.EstadoLectura;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "seguimiento")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Seguimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idseguimiento;

    @Column(nullable = false)
    private LocalDate fecha = LocalDate.now();

    @Column(name = "num_pagina", nullable = false)
    private Integer numPagina = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoLectura estado = EstadoLectura.LEYENDO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idlibro", nullable = false)
    private Libro libro;
}
