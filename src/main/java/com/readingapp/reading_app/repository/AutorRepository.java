package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Autor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AutorRepository extends JpaRepository<Autor, Long> {
    List<Autor> findByNombreContainingIgnoreCase(String nombre);
    @Query(value = "SELECT * FROM autor WHERE LOWER(unaccent(nombre)) = LOWER(unaccent(:nombre)) LIMIT 1", nativeQuery = true)
    Optional<Autor> findByNombreNormalizado(@Param("nombre") String nombre);
}
