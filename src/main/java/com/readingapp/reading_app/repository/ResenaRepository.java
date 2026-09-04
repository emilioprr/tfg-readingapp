package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.Resena;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResenaRepository extends JpaRepository<Resena, Long> {
    Page<Resena> findByUsuarioIdusuario(Long idusuario, Pageable pageable);
    Page<Resena> findByLibroIdlibro(Long idlibro, Pageable pageable);
    Page<Resena> findByEsPublicaTrue(Pageable pageable);
    Optional<Resena> findByUsuarioIdusuarioAndLibroIdlibro(Long idusuario, Long idlibro);
    long countByUsuarioIdusuarioAndLibroIdlibro(Long idusuario, Long idlibro);
    @Query("SELECT r FROM Resena r WHERE r.libro.idlibro = :idlibro AND r.esPublica = true ORDER BY SIZE(r.likes) DESC")
    Page<Resena> findByLibroIdlibroAndEsPublicaTrueOrderByLikesDesc(@Param("idlibro") Long idlibro, Pageable pageable);
    @Query("SELECT r FROM Resena r WHERE r.usuario.idusuario = :idusuario AND r.esPublica = true ORDER BY SIZE(r.likes) DESC")
    Page<Resena> findByUsuarioIdusuarioAndEsPublicaTrueOrderByLikesDesc(@Param("idusuario") Long idusuario, Pageable pageable);
    @Query("SELECT AVG(r.puntuacion) FROM Resena r WHERE r.libro.idlibro = :idlibro AND r.esPublica = true")
    Double findNotaMediaByLibro(@Param("idlibro") Long idlibro);
    long countByLibroIdlibroAndEsPublicaTrue(Long idlibro);
    @Query("SELECT r FROM Resena r WHERE r.esPublica = true AND r.usuario IN " +
            "(SELECT s FROM Usuario u JOIN u.seguidos s WHERE u.idusuario = :idusuario) " +
            "ORDER BY r.fechaCreacion DESC")
    List<Resena> findResenasDeSeguidos(@Param("idusuario") Long idusuario, Pageable pageable);
    @Query("SELECT r FROM Resena r JOIN r.likes u WHERE u.idusuario = :idusuario ORDER BY r.fechaCreacion DESC")
    List<Resena> findResenasLikeadasPorUsuario(@Param("idusuario") Long idusuario);
}