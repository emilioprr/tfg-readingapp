package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Libro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LibroRepository extends JpaRepository<Libro, Long> {
    List<Libro> findByTituloContainingIgnoreCase(String titulo);
    List<Libro> findByGeneroIgnoreCase(String genero);
    List<Libro> findByAutorIdautor(Long idautor);
}

