package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "lista")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Lista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idlista;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "es_publica")
    private Boolean esPublica = true;

    @Column(name = "es_automatica")
    private Boolean esAutomatica = false;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario", nullable = false)
    private Usuario usuario;

    @ManyToMany
    @JoinTable(
            name = "lista_libro",
            joinColumns = @JoinColumn(name = "idlista"),
            inverseJoinColumns = @JoinColumn(name = "idlibro")
    )
    private Set<Libro> libros = new HashSet<>();
}
