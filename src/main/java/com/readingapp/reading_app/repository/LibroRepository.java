package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Libro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LibroRepository extends JpaRepository<Libro, Long> {
    @Query("SELECT l FROM Libro l WHERE (LOWER(l.titulo) LIKE LOWER(CONCAT('%', :texto, '%')) " +
            "OR LOWER(l.autor.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))) " +
            "AND l.idlibro = (SELECT MIN(l2.idlibro) FROM Libro l2 WHERE l2.titulo = l.titulo AND l2.autor = l.autor)")
    Page<Libro> findByTituloContainingIgnoreCase(@Param("texto") String texto, Pageable pageable);
    List<Libro> findByTituloContainingIgnoreCase(String titulo);
    List<Libro> findByGeneroIgnoreCase(String genero, Pageable pageable);
    List<Libro> findByAutorIdautor(Long idautor, Pageable pageable);
    boolean existsByIdapiexterna(String idapiexterna);
    boolean existsByIsbn(String isbn);
    @Query("SELECT l.genero FROM Libro l WHERE l.genero IS NOT NULL GROUP BY l.genero HAVING COUNT(l) >= 3 ORDER BY COUNT(l) DESC")
    List<String> findGenerosDistintos();

    @Query("SELECT l FROM Libro l WHERE l.genero = :genero ORDER BY l.idlibro DESC")
    List<Libro> findByGenero(@Param("genero") String genero, Pageable pageable);

    @Query("SELECT l FROM Libro l WHERE l.idlibro IN " +
            "(SELECT r.libro.idlibro FROM Resena r WHERE r.esPublica = true " +
            "GROUP BY r.libro.idlibro ORDER BY COUNT(r) DESC)")
    List<Libro> findPopulares(Pageable pageable);

    @Query("SELECT r.libro FROM Resena r WHERE r.esPublica = true AND r.usuario IN " +
            "(SELECT s FROM Usuario u JOIN u.seguidos s WHERE u.idusuario = :idusuario) " +
            "GROUP BY r.libro ORDER BY MAX(r.fechaCreacion) DESC")
    List<Libro> findLibrosPopularesEntreSeguidos(@Param("idusuario") Long idusuario, Pageable pageable);

    @Query(value = "SELECT COUNT(*) > 0 FROM libro l JOIN autor a ON l.idautor = a.idautor " +
            "WHERE LOWER(unaccent(l.titulo)) = LOWER(unaccent(:titulo)) " +
            "AND LOWER(unaccent(a.nombre)) = LOWER(unaccent(:nombreAutor))", nativeQuery = true)
    boolean existsByTituloYAutorNormalizado(@Param("titulo") String titulo, @Param("nombreAutor") String nombreAutor);
}

