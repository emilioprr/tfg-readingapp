package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "libro")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Libro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idlibro;

    @Column(length = 100)
    private String idapiexterna;

    @Column(nullable = false, length = 300)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String sinopsis;

    @Column(name = "anio_publicacion")
    private Integer anioPublicacion;

    @Column(name = "num_paginas")
    private Integer numPaginas;

    @Column(length = 20)
    private String isbn;

    @Column(length = 500)
    private String portada;

    @Column(length = 100)
    private String genero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idautor", nullable = false)
    private Autor autor;

    @OneToMany(mappedBy = "libro", cascade = CascadeType.ALL)
    private List<Resena> resenas = new ArrayList<>();

    @OneToMany(mappedBy = "libro", cascade = CascadeType.ALL)
    private List<Anotacion> anotaciones = new ArrayList<>();

    @OneToMany(mappedBy = "libro", cascade = CascadeType.ALL)
    private List<Seguimiento> seguimientos = new ArrayList<>();

    @ManyToMany(mappedBy = "librosFavoritos")
    private Set<Usuario> favoritoDe = new HashSet<>();

    @ManyToMany(mappedBy = "libros")
    private Set<Lista> listas = new HashSet<>();
}
