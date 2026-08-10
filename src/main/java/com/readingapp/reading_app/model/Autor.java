package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Table(name = "autor")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Autor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idautor;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String biografia;

    @Column(length = 500)
    private String foto;

    @Column(length = 100)
    private String nacionalidad;

    @Column
    private Integer seguidores = 0;

    @OneToMany(mappedBy = "autor", cascade = CascadeType.ALL)
    private List<Libro> libros = new ArrayList<>();

    @ManyToMany(mappedBy = "autoresSeguidos")
    private Set<Usuario> seguidoresList = new HashSet<>();
}
