package com.readingapp.reading_app.service;

import com.readingapp.reading_app.service.RelevanciaBusqueda.Candidato;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Comparator;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("RelevanciaBusqueda - orden de resultados de búsqueda")
class RelevanciaBusquedaTest {

    private static Candidato libro(String titulo, String autor, Integer valoraciones) {
        return new Candidato(titulo, autor, valoraciones, true, true, "es");
    }

    private static List<String> ordenar(String consulta, List<Candidato> candidatos) {
        return candidatos.stream()
                .sorted(Comparator.comparingDouble((Candidato c) -> RelevanciaBusqueda.puntuar(consulta, c)).reversed())
                .map(c -> c.titulo() + " / " + c.autor())
                .toList();
    }

    @Test
    @DisplayName("\"las ratas\": la novela de Delibes va antes que manuales y tratados de medicina")
    void lasRatasDelibesPrimero() {
        List<String> orden = ordenar("las ratas", List.of(
                libro("Las ratas: La elección, el alojamiento, los cuidados cotidianos, la reproducción, la prevención y la cura de las enfermedades, la preparación de un criadero...", "Olivier Laurent", null),
                libro("Williams. Tratado de endocrinología", "Shlomo Melmed", null),
                libro("La Rata de Alcantarilla", "Tomás Landete Castillejos", null),
                libro("Las ratas", "Miguel Delibes", 4),
                libro("Las ratas", "José Bianco", null)));

        assertThat(orden.get(0)).isEqualTo("Las ratas / Miguel Delibes");
        assertThat(orden.get(1)).isEqualTo("Las ratas / José Bianco");
        assertThat(orden.subList(3, 5)).containsExactlyInAnyOrder(
                "Williams. Tratado de endocrinología / Shlomo Melmed",
                "La Rata de Alcantarilla / Tomás Landete Castillejos");
    }

    @Test
    @DisplayName("Título y autor juntos (\"ratas delibes\") encuentran el libro")
    void tituloYAutorJuntos() {
        List<String> orden = ordenar("ratas delibes", List.of(
                libro("Las ratas", "José Bianco", null),
                libro("Las ratas", "Miguel Delibes", null)));

        assertThat(orden.get(0)).isEqualTo("Las ratas / Miguel Delibes");
    }

    @Test
    @DisplayName("Buscar por autor sube sus libros aunque el título no coincida")
    void busquedaPorAutor() {
        List<String> orden = ordenar("delibes", List.of(
                libro("Delibes y la caza", "Otro Autor", null),
                libro("El camino", "Miguel Delibes", 10),
                libro("Tratado de caza", "Alguien", null)));

        assertThat(orden.get(0)).isEqualTo("El camino / Miguel Delibes");
    }

    @Test
    @DisplayName("Mayúsculas, tildes y signos no afectan a la coincidencia")
    void normalizacion() {
        double exacta = RelevanciaBusqueda.puntuar("CIEN ANOS DE SOLEDAD", libro("Cien años de soledad", "Gabriel García Márquez", null));
        double parcial = RelevanciaBusqueda.puntuar("CIEN ANOS DE SOLEDAD", libro("Guía de lectura de Cien años de soledad", "Autor", null));

        assertThat(exacta).isGreaterThan(parcial);
    }

    @Test
    @DisplayName("Al buscar un autor, sus libros van antes que los estudios titulados con su nombre")
    void librosDelAutorAntesQueEstudiosSobreEl() {
        List<Candidato> candidatos = List.of(
                libro("Miguel Delibes", "Cristóbal Cuevas García", null),
                libro("El camino", "Miguel Delibes", 30),
                libro("Los santos inocentes", "Miguel Delibes", 50),
                libro("Cinco horas con Mario", "Miguel Delibes", 20));
        boolean deAutor = RelevanciaBusqueda.esBusquedaDeAutor("miguel delibes",
                candidatos.stream().map(Candidato::autor).toList());

        List<String> orden = candidatos.stream()
                .sorted(Comparator.comparingDouble((Candidato c) -> RelevanciaBusqueda.puntuar("miguel delibes", c, deAutor)).reversed())
                .map(Candidato::titulo).toList();

        assertThat(deAutor).isTrue();
        assertThat(orden).last().isEqualTo("Miguel Delibes");
    }

    @Test
    @DisplayName("Un congreso cuyo nombre contiene el título no cuenta como coincidencia de autor")
    void congresoNoEsAutor() {
        List<String> orden = ordenar("cien años de soledad", List.of(
                libro("Memorias", "Congreso Nacional de Literatura, Lingüística y Semiótica Cien Años de soledad, treinta años después", null),
                libro("Cien años de soledad", "Gabriel García Márquez", 100),
                libro("Cien años de soledad de Gabriel García Márquez (Guía de lectura)", "ResumenExpress", null)));

        assertThat(orden.get(orden.size() - 1)).startsWith("Memorias");
    }

    @Test
    @DisplayName("Una búsqueda de título no se confunde con una de autor")
    void noEsBusquedaDeAutor() {
        assertThat(RelevanciaBusqueda.esBusquedaDeAutor("las ratas",
                List.of("Miguel Delibes", "José Bianco", "James Herbert"))).isFalse();
    }

    @Test
    @DisplayName("Dos ediciones del mismo libro tienen la misma clave de obra")
    void mismaObra() {
        assertThat(RelevanciaBusqueda.mismaObra("Las ratas", "Miguel Delibes", "Las Ratas: edición escolar", "MIGUEL DELIBES")).isTrue();
        assertThat(RelevanciaBusqueda.mismaObra("Las ratas", "Miguel Delibes", "Las ratas", "José Bianco")).isFalse();
        assertThat(RelevanciaBusqueda.mismaObra("Las ratas en las paredes", "H. P. Lovecraft",
                "Las Ratas en las Paredes", "Howard Phillips Lovecraft")).isTrue();
        assertThat(RelevanciaBusqueda.mismaObra("El Principito", "Antoine de Saint-Exupéry",
                "El Principito (Spanish Edition)", "De Saint-Exupéry, Antoine")).isTrue();
        assertThat(RelevanciaBusqueda.mismaObra("El Principito", "Antoine de Saint-Exupéry",
                "El Principito / The Little Prince", "Antoine Saint Exupry")).isTrue();
    }
}
