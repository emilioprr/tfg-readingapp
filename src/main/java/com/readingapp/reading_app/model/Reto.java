package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "reto")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Reto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idreto;

    @Column(nullable = false)
    private Integer metapaginas;

    @Column(nullable = false)
    private LocalDate fechainicio;

    private LocalDate fechafin;

    @Column(name = "reto_cumplido")
    private Boolean retoCumplido = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;
}