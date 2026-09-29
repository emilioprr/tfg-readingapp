package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.CitaDTO;
import com.readingapp.reading_app.model.Anotacion;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import com.readingapp.reading_app.repository.AnotacionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/*Muro de citas contra una base de datos real (H2).*/
@DataJpaTest
@Import(CitaService.class)
@DisplayName("CitaService - muro de citas y citas guardadas")
class CitaServiceTest {

    @Autowired private TestEntityManager em;
    @Autowired private CitaService citaService;
    @Autowired private AnotacionRepository anotacionRepository;

    private Usuario ana, luis;
    private Libro libro;
    private int orden = 0;

    private Usuario usuario(String nombre) {
        return em.persist(Usuario.builder().nombre(nombre).email(nombre + "@test.com").password("x")
                .fechaAlta(LocalDate.now()).citasGuardadas(new HashSet<>()).build());
    }

    private Anotacion anotacion(Usuario u, TipoAnotacion tipo, boolean publica, String texto) {
        return em.persist(Anotacion.builder().usuario(u).libro(libro).tipo(tipo).esPublica(publica)
                .tieneSpoiler(false).texto(texto).fecha(LocalDateTime.now().plusSeconds(orden++)).build());
    }

    @BeforeEach
    void setUp() {
        ana = usuario("ana");
        luis = usuario("luis");
        Autor autor = em.persist(Autor.builder().nombre("Miguel Delibes").seguidores(0).build());
        libro = em.persist(Libro.builder().titulo("Las ratas").numPaginas(200).autor(autor).build());
        // Ana es quien usa la app en estos tests
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "ana@test.com", ana.getIdusuario(), List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    private List<String> textos(CitaDTO.Pagina pagina) {
        return pagina.getCitas().stream().map(CitaDTO.Response::getTexto).toList();
    }

    @Test
    @DisplayName("El muro solo muestra citas públicas (no notas ni citas privadas), las más recientes primero")
    void muroSoloCitasPublicas() {
        anotacion(luis, TipoAnotacion.CITA, true, "Primera cita");
        anotacion(luis, TipoAnotacion.CITA, false, "Cita privada");
        anotacion(luis, TipoAnotacion.NOTA, true, "Una nota");
        anotacion(ana, TipoAnotacion.CITA, true, "Segunda cita");
        em.flush();

        assertThat(textos(citaService.obtenerComunidad(0, 20))).containsExactly("Segunda cita", "Primera cita");
    }

    @Test
    @DisplayName("Guardar una cita la marca como guardada y aparece en \"Guardadas\"; quitarla la saca")
    void guardarYQuitar() {
        Anotacion cita = anotacion(luis, TipoAnotacion.CITA, true, "Una cita bonita");
        em.flush();

        citaService.guardar(cita.getIdanotacion());
        em.flush();
        assertThat(citaService.obtenerComunidad(0, 20).getCitas().get(0).getGuardada()).isTrue();
        assertThat(textos(citaService.obtenerGuardadas(ana.getIdusuario(), 0, 20))).containsExactly("Una cita bonita");

        citaService.quitar(cita.getIdanotacion());
        em.flush();
        assertThat(citaService.obtenerGuardadas(ana.getIdusuario(), 0, 20).getCitas()).isEmpty();
    }

    @Test
    @DisplayName("No se pueden guardar citas privadas de otros ni notas")
    void noGuardarPrivadasNiNotas() {
        Anotacion privada = anotacion(luis, TipoAnotacion.CITA, false, "Privada");
        Anotacion nota = anotacion(luis, TipoAnotacion.NOTA, true, "Nota");
        em.flush();

        assertThatThrownBy(() -> citaService.guardar(privada.getIdanotacion())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> citaService.guardar(nota.getIdanotacion())).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Si el autor hace privada una cita guardada, deja de verse en \"Guardadas\"")
    void citaQuePasaAPrivada() {
        Anotacion cita = anotacion(luis, TipoAnotacion.CITA, true, "Ahora pública");
        em.flush();
        citaService.guardar(cita.getIdanotacion());
        cita.setEsPublica(false);
        em.flush();

        assertThat(citaService.obtenerGuardadas(ana.getIdusuario(), 0, 20).getCitas()).isEmpty();
    }

    @Test
    @DisplayName("Las citas guardadas de otro usuario se ven en su perfil, pero no las privadas de terceros")
    void guardadasDeOtroPerfil() {
        Anotacion publica = anotacion(ana, TipoAnotacion.CITA, true, "Pública de Ana");
        Anotacion privada = anotacion(luis, TipoAnotacion.CITA, true, "De Luis, luego privada");
        em.flush();
        // Luis guarda las dos; después hace privada la suya
        luis.getCitasGuardadas().add(publica);
        luis.getCitasGuardadas().add(privada);
        privada.setEsPublica(false);
        em.flush();

        // Ana visita el perfil de Luis: ve la pública (marcada como no guardada por ella), no la privada de Luis
        CitaDTO.Pagina pagina = citaService.obtenerGuardadas(luis.getIdusuario(), 0, 20);
        assertThat(textos(pagina)).containsExactly("Pública de Ana");
        assertThat(pagina.getCitas().get(0).getGuardada()).isFalse();
    }

    @Test
    @DisplayName("Una cita guardada por otros se puede borrar (se quita antes de sus guardados)")
    void borrarCitaGuardada() {
        Anotacion cita = anotacion(luis, TipoAnotacion.CITA, true, "Se va a borrar");
        em.flush();
        citaService.guardar(cita.getIdanotacion());
        em.flush();

        anotacionRepository.borrarDeCitasGuardadas(cita.getIdanotacion());
        em.clear();
        anotacionRepository.deleteById(cita.getIdanotacion());
        em.flush();

        assertThat(anotacionRepository.findById(cita.getIdanotacion())).isEmpty();
    }

    @Test
    @DisplayName("La paginación indica si hay más citas")
    void paginacion() {
        for (int i = 0; i < 3; i++) anotacion(luis, TipoAnotacion.CITA, true, "Cita " + i);
        em.flush();

        assertThat(citaService.obtenerComunidad(0, 2).getHayMas()).isTrue();
        assertThat(citaService.obtenerComunidad(1, 2).getHayMas()).isFalse();
    }
}
