package com.readingapp.reading_app.dto;

import lombok.*;

import java.util.List;

public class CatalogoDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    /*Datos mínimos de un libro para las filas del catálogo (sin las estadísticas del detalle).*/
    public static class LibroResumen {
        private Long idlibro;
        private String titulo;
        private String portada;
        private String nombreAutor;
        private Integer anioPublicacion;
        private String categoria;
        private Double notaMedia;
        private Integer numResenas;
        private String sinopsis; // solo en el libro destacado
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Fila {
        private String clave;
        private String titulo;
        private String slugCategoria; // si la fila es una categoría, para el enlace "Ver todo"
        private List<LibroResumen> libros;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CategoriaInfo {
        private String slug;
        private String nombre;
        private Integer total;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    /*Una página de libros de una categoría ("Ver todo").*/
    public static class PaginaCategoria {
        private String slug;
        private String nombre;
        private Integer total;
        private Integer pagina;
        private Boolean hayMas;
        private List<LibroResumen> libros;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private LibroResumen destacado;
        private List<Fila> filas;
        private List<CategoriaInfo> categorias;
    }
}
