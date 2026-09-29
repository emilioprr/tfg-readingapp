package com.readingapp.reading_app.repository;

import com.readingapp.reading_app.model.*;
import com.readingapp.reading_app.model.enums.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/*Borrado de una cuenta contra una base de datos real (H2): no debe quedar nada que apunte al usuario.*/
@DataJpaTest
@Import(BorradoCuentaRepository.class)
@DisplayName("BorradoCuentaRepository - eliminar una cuenta con todos sus datos")
class BorradoCuentaRepositoryTest {

    @Autowired private TestEntityManager em;
    @Autowired private BorradoCuentaRepository borradoCuentaRepository;

    private Usuario ana;   // la cuenta que se borra
    private Usuario luis;  // otro usuario, cuyos datos deben quedar intactos
    private Autor autor;
    private Libro libro;
    private Resena resenaDeAna;
    private Resena resenaDeLuis;

    private Usuario usuario(String nombre) {
        return em.persist(Usuario.builder().nombre(nombre).email(nombre + "@test.com").password("x")
                .fechaAlta(LocalDate.now()).seguidos(new HashSet<>()).resenasLikeadas(new HashSet<>())
                .autoresSeguidos(new HashSet<>()).librosFavoritos(new HashSet<>()).citasGuardadas(new HashSet<>()).build());
    }

    private Resena resena(Usuario u) {
        return em.persist(Resena.builder().usuario(u).libro(libro).puntuacion(new BigDecimal("4"))
                .fechaCreacion(LocalDateTime.now()).etiquetas(new HashSet<>(Set.of(EtiquetaResena.TENSO))).build());
    }

    @BeforeEach
    void setUp() {
        ana = usuario("ana");
        luis = usuario("luis");
        autor = em.persist(Autor.builder().nombre("Miguel Delibes").seguidores(1).build());
        libro = em.persist(Libro.builder().titulo("Las ratas").numPaginas(200).autor(autor).build());

        // Reseñas de los dos, con likes cruzados
        resenaDeAna = resena(ana);
        resenaDeLuis = resena(luis);
        luis.getResenasLikeadas().add(resenaDeAna);
        ana.getResenasLikeadas().add(resenaDeLuis);

        // Se siguen mutuamente; Ana sigue al autor y tiene el libro en favoritos
        ana.getSeguidos().add(luis);
        luis.getSeguidos().add(ana);
        ana.getAutoresSeguidos().add(autor);
        ana.getLibrosFavoritos().add(libro);

        // Actividad de lectura, lista, recomendaciones y notificaciones
        em.persist(Seguimiento.builder().usuario(ana).libro(libro).estado(EstadoLectura.LEYENDO)
                .numPagina(20).fecha(LocalDate.now()).build());
        em.persist(Lista.builder().nombre("Favoritas").usuario(ana).esPublica(true)
                .fechaCreacion(LocalDateTime.now()).libros(new HashSet<>(Set.of(libro))).build());
        Recomendacion deLuisAAna = em.persist(Recomendacion.builder().emisor(luis).receptor(ana).libro(libro)
                .fecha(LocalDateTime.now()).visto(false).build());
        em.persist(Notificacion.builder().usuario(ana).tipo(TipoNotificacion.NUEVA_RECOMENDACION)
                .recomendacion(deLuisAAna).usuarioOrigen(luis).fecha(LocalDateTime.now()).leida(false).build());
        em.persist(Notificacion.builder().usuario(luis).tipo(TipoNotificacion.LIKE_RESENA)
                .resena(resenaDeLuis).usuarioOrigen(ana).fecha(LocalDateTime.now()).leida(false).build());

        // Citas: Luis guarda una de Ana y Ana guarda una de Luis
        Anotacion citaDeAna = em.persist(Anotacion.builder().usuario(ana).libro(libro).tipo(TipoAnotacion.CITA)
                .esPublica(true).tieneSpoiler(false).texto("Cita de Ana").fecha(LocalDateTime.now()).build());
        Anotacion citaDeLuis = em.persist(Anotacion.builder().usuario(luis).libro(libro).tipo(TipoAnotacion.CITA)
                .esPublica(true).tieneSpoiler(false).texto("Cita de Luis").fecha(LocalDateTime.now()).build());
        luis.getCitasGuardadas().add(citaDeAna);
        ana.getCitasGuardadas().add(citaDeLuis);

        // Reto creado por Ana en el que participa Luis
        Reto reto = em.persist(Reto.builder().titulo("Leer 5 libros").tipo(TipoReto.LIBROS)
                .modalidad(ModalidadReto.COMPARTIDO).meta(5).fechaInicio(LocalDate.now())
                .fechaFin(LocalDate.now().plusMonths(1)).creador(ana).build());
        em.persist(ParticipanteReto.builder().reto(reto).usuario(luis).fechaUnion(LocalDateTime.now()).build());

        em.flush();
    }

    private long contar(String sql) {
        return ((Number) em.getEntityManager().createNativeQuery(sql).getSingleResult()).longValue();
    }

    @Test
    @DisplayName("Se borra el usuario y no queda ninguna fila que apunte a él")
    void noQuedaNadaDelUsuario() {
        Long id = ana.getIdusuario();

        borradoCuentaRepository.borrarCuenta(id);

        assertThat(em.find(Usuario.class, id)).isNull();
        for (String sql : new String[]{
                "SELECT COUNT(*) FROM resena WHERE idusuario = " + id,
                "SELECT COUNT(*) FROM likea WHERE idusuario = " + id,
                "SELECT COUNT(*) FROM seguimiento WHERE idusuario = " + id,
                "SELECT COUNT(*) FROM lista WHERE idusuario = " + id,
                "SELECT COUNT(*) FROM favorito WHERE idusuario = " + id,
                "SELECT COUNT(*) FROM sigue WHERE idusuario_seguidor = " + id + " OR idusuario_seguido = " + id,
                "SELECT COUNT(*) FROM sigue_autor WHERE idusuario = " + id,
                "SELECT COUNT(*) FROM recomendacion WHERE idusuario_emisor = " + id + " OR idusuario_receptor = " + id,
                "SELECT COUNT(*) FROM notificacion WHERE idusuario = " + id + " OR idusuario_origen = " + id,
                "SELECT COUNT(*) FROM reto WHERE id_creador = " + id,
                "SELECT COUNT(*) FROM cita_guardada WHERE idusuario = " + id,
                "SELECT COUNT(*) FROM anotacion WHERE idusuario = " + id}) {
            assertThat(contar(sql)).as(sql).isZero();
        }
    }

    @Test
    @DisplayName("Los datos del otro usuario se conservan, sin los likes ni avisos ligados a la cuenta borrada")
    void datosDelOtroUsuarioSeConservan() {
        borradoCuentaRepository.borrarCuenta(ana.getIdusuario());

        assertThat(em.find(Usuario.class, luis.getIdusuario())).isNotNull();
        assertThat(em.find(Resena.class, resenaDeLuis.getIdresena())).isNotNull();
        assertThat(contar("SELECT COUNT(*) FROM likea WHERE idresena = " + resenaDeLuis.getIdresena())).isZero();
        assertThat(em.find(Libro.class, libro.getIdlibro())).isNotNull();
    }

    @Test
    @DisplayName("El autor que seguía pierde ese seguidor en su contador")
    void autorPierdeSeguidor() {
        borradoCuentaRepository.borrarCuenta(ana.getIdusuario());

        assertThat(em.find(Autor.class, autor.getIdautor()).getSeguidores()).isZero();
    }
}
