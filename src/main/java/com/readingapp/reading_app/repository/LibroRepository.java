package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Libro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LibroRepository extends JpaRepository<Libro, Long> {
    Page<Libro> findByTituloContainingIgnoreCase(String titulo, Pageable pageable);
    List<Libro> findByTituloContainingIgnoreCase(String titulo);
    List<Libro> findByGeneroIgnoreCase(String genero, Pageable pageable);
    List<Libro> findByAutorIdautor(Long idautor, Pageable pageable);
    boolean existsByIdapiexterna(String idapiexterna);
    boolean existsByIsbn(String isbn);
}

