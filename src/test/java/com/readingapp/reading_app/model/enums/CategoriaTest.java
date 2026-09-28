package com.readingapp.reading_app.model.enums;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Categoria - agrupación de géneros de Google Books")
class CategoriaTest {

    @ParameterizedTest(name = "\"{0}\" → {1}")
    @DisplayName("Asigna cada género a su categoría")
    @CsvSource(delimiter = ';', value = {
            "Fiction;NOVELA",
            "Ficción;NOVELA",
            "Mexican fiction;NOVELA",
            "Juvenile Fiction;JUVENIL",
            "Young Adult Fiction;JUVENIL",
            "Juvenile Nonfiction;JUVENIL",
            "Comics & Graphic Novels;COMIC",
            "Science fiction;FANTASIA",
            "Fantasy fiction, American;FANTASIA",
            "Dragons;FANTASIA",
            "Biography & Autobiography;BIOGRAFIA",
            "Literary Collections;LITERATURA",
            "Spanish literature;LITERATURA",
            "Short stories, Russian;LITERATURA",
            "Literary Criticism;ENSAYO",
            "Social Science;ENSAYO",
            "Political Science;ENSAYO",
            "History;HISTORIA",
            "Philosophy;FILOSOFIA",
            "Self-Help;AUTOAYUDA",
            "Business & Economics;NEGOCIOS",
            "Medical;CIENCIA",
            "Performing Arts;ARTE",
            "Language Arts & Disciplines;ENSAYO",
            "Education;EDUCACION",
            "Computer adventure games;OCIO",
    })
    void asignaCategoria(String genero, Categoria esperada) {
        assertThat(Categoria.de(genero)).contains(esperada);
    }

    @ParameterizedTest
    @DisplayName("Los géneros que no encajan (lugares, derecho...) no tienen categoría")
    @ValueSource(strings = {"California", "Law", "Government publications", "Spain"})
    void sinCategoria(String genero) {
        assertThat(Categoria.de(genero)).isEmpty();
    }

    @ParameterizedTest
    @DisplayName("Sin género no hay categoría")
    @NullAndEmptySource
    void generoVacio(String genero) {
        assertThat(Categoria.de(genero)).isEmpty();
    }

    @Test
    @DisplayName("Se puede recuperar una categoría por su slug")
    void porSlug() {
        assertThat(Categoria.porSlug("fantasia")).contains(Categoria.FANTASIA);
        assertThat(Categoria.porSlug("no-existe")).isEmpty();
    }
}
