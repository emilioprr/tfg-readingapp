package com.readingapp.reading_app.model.enums;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Categorías propias del catálogo. Los libros guardan el género tal cual lo da Google Books
 * (en inglés o español y muy fragmentado: "Fiction", "Ficción", "Juvenile Fiction", "Dragons"...),
 * así que aquí se agrupan en unas pocas categorías legibles.
 *
 * El orden importa: se asigna la primera categoría cuyas palabras clave aparezcan en el género
 * (p. ej. "Juvenile Fiction" es Juvenil antes que Novela).
 */
public enum Categoria {

    JUVENIL("Juvenil", "juvenil", "juvenile", "young adult", "children", "infantil"),
    COMIC("Cómic y novela gráfica", "comic", "comics", "graphic novel", "novela grafica", "manga"),
    FANTASIA("Fantasía y ciencia ficción", "fantasy", "fantasia", "science fiction", "ciencia ficcion",
            "dragon", "magic", "alien", "imaginary", "sobrenatural", "vampire", "dune"),
    MISTERIO("Misterio y thriller", "mystery", "misterio", "thriller", "suspense", "crime", "detective",
            "murder", "policiaca", "delitos"),
    BIOGRAFIA("Biografías y memorias", "biography", "biografia", "autobiography", "memoir", "authors", "composers"),
    NOVELA("Novela", "fiction", "ficcion", "novel", "novela", "romance"),
    LITERATURA("Clásicos y literatura", "literature", "literatura", "literary collections", "poetry", "poesia",
            "drama", "short stories", "cuentos", "stories", "epic", "eddas", "hamlet", "oedipus", "theater", "teatro"),
    HISTORIA("Historia", "history", "historia", "holy roman empire", "courts and courtiers", "wallachia"),
    FILOSOFIA("Filosofía y religión", "philosophy", "filosofia", "religion", "jainism", "providence",
            "body, mind", "aesthetics", "spirit"),
    AUTOAYUDA("Psicología y autoayuda", "psychology", "psicologia", "self-help", "autoayuda", "conduct of life",
            "success", "courage", "friendship", "rejection", "psychiatry"),
    ENSAYO("Ensayo y sociedad", "literary criticism", "essay", "ensayo", "social science", "sociology",
            "political", "international relations", "classism", "caste", "language arts", "capital punishment"),
    NEGOCIOS("Economía y empresa", "business", "economics", "economia", "investment", "saving", "labor",
            "brand name"),
    CIENCIA("Ciencia y naturaleza", "science", "ciencia", "nature", "astronomy", "botany", "ecology", "medic",
            "engineering", "nervous system", "agriculture", "cattle", "energy", "computers", "technology"),
    ARTE("Arte y música", "art", "arte", "music", "musica", "performing arts", "dance", "photography"),
    EDUCACION("Educación e idiomas", "education", "educacion", "study aids", "language study", "foreign language",
            "english language", "spanish language", "reference", "encyclopedias"),
    OCIO("Ocio y estilo de vida", "games", "chess", "card games", "crafts", "hobbies", "cooking", "cocina",
            "house & home", "antiques", "amusements", "sports", "travel");

    private final String nombre;
    private final List<String> claves;

    Categoria(String nombre, String... claves) {
        this.nombre = nombre;
        this.claves = List.of(claves);
    }

    public String getNombre() {
        return nombre;
    }

    /** Identificador para URLs, p. ej. "fantasia". */
    public String getSlug() {
        return name().toLowerCase();
    }

    /** Categoría a la que pertenece un género de Google Books, si encaja en alguna. */
    public static Optional<Categoria> de(String genero) {
        if (genero == null || genero.isBlank()) return Optional.empty();
        String g = normalizar(genero);
        return Arrays.stream(values())
                .filter(c -> c.claves.stream().anyMatch(clave -> contienePalabra(g, clave)))
                .findFirst();
    }

    public static Optional<Categoria> porSlug(String slug) {
        return Arrays.stream(values()).filter(c -> c.getSlug().equalsIgnoreCase(slug)).findFirst();
    }

    /** La clave debe empezar una palabra: "fiction" casa con "Juvenile Fiction" pero no con "Nonfiction". */
    private static boolean contienePalabra(String texto, String clave) {
        int i = texto.indexOf(clave);
        while (i >= 0) {
            if (i == 0 || !Character.isLetter(texto.charAt(i - 1))) return true;
            i = texto.indexOf(clave, i + 1);
        }
        return false;
    }

    private static String normalizar(String texto) {
        return Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
    }
}
