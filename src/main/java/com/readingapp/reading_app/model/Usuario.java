package com.readingapp.reading_app.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "usuario")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Usuario {

    // ATRIBUTOS

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idusuario;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    //Columna de tipo text en vez del varchar habitual
    @Column(columnDefinition = "TEXT")
    private String biografia;

    @Column(length = 500)
    private String avatar;

    @Column(nullable = false, length = 255)
    private String password;

    //Cambio de nombre ya que postgre usa snake case por convención
    @Column(name = "fecha_alta", nullable = false)
    private LocalDate fechaAlta = LocalDate.now();

    @Column
    private Integer seguidores = 0;

    // RELACIONES
    @ManyToMany
    @JoinTable(
            name = "sigue",
            joinColumns = @JoinColumn(name = "idusuario_seguidor"),
            inverseJoinColumns = @JoinColumn(name = "idusuario_seguido")
    )
    private Set<Usuario> seguidos = new HashSet<>();

    @ManyToMany(mappedBy = "seguidos")
    private Set<Usuario> seguidoresList = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "sigue_autor",
            joinColumns = @JoinColumn(name = "idusuario"),
            inverseJoinColumns = @JoinColumn(name = "idautor")
    )
    private Set<Autor> autoresSeguidos = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "favorito",
            joinColumns = @JoinColumn(name = "idusuario"),
            inverseJoinColumns = @JoinColumn(name = "idlibro")
    )
    private Set<Libro> librosFavoritos = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "likea",
            joinColumns = @JoinColumn(name = "idusuario"),
            inverseJoinColumns = @JoinColumn(name = "idresena")
    )
    private Set<Resena> resenasLikeadas = new HashSet<>();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<Resena> resenas = new ArrayList<>();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<Anotacion> anotaciones = new ArrayList<>();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<Lista> listas = new ArrayList<>();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<Reto> retos = new ArrayList<>();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<Seguimiento> seguimientos = new ArrayList<>();

    @OneToMany(mappedBy = "emisor", cascade = CascadeType.ALL)
    private List<Recomendacion> recomendacionesEnviadas = new ArrayList<>();

    @OneToMany(mappedBy = "receptor", cascade = CascadeType.ALL)
    private List<Recomendacion> recomendacionesRecibidas = new ArrayList<>();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<Notificacion> notificaciones = new ArrayList<>();
}
