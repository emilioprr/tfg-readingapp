package com.readingapp.reading_app.controller;

import com.readingapp.reading_app.config.JwtUtil;
import com.readingapp.reading_app.model.Anotacion;
import com.readingapp.reading_app.model.Autor;
import com.readingapp.reading_app.model.Libro;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.model.enums.TipoAnotacion;
import com.readingapp.reading_app.repository.AnotacionRepository;
import com.readingapp.reading_app.repository.AutorRepository;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/*Mural de citas a nivel HTTP: guardar una cita desde el muro y verla en el mural del perfil.*/
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("CitaController - guardar desde el muro y ver el mural del perfil")
class CitaControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private AutorRepository autorRepository;
    @Autowired private LibroRepository libroRepository;
    @Autowired private AnotacionRepository anotacionRepository;

    private Usuario usuario(String nombre) {
        String sufijo = UUID.randomUUID().toString().substring(0, 8);
        return usuarioRepository.save(Usuario.builder().nombre(nombre + sufijo).email(nombre + sufijo + "@test.com")
                .password("x").fechaAlta(LocalDate.now()).build());
    }

    private String token(Usuario u) {
        return "Bearer " + jwtUtil.generateToken(u.getIdusuario(), u.getEmail(), "USER");
    }

    @Test
    @DisplayName("La cita guardada en el muro aparece en el mural del perfil, para él y para otros")
    void guardarYVerEnMural() throws Exception {
        Usuario ana = usuario("ana");
        Usuario luis = usuario("luis");
        Autor autor = autorRepository.save(Autor.builder().nombre("Miguel Delibes").seguidores(0).build());
        Libro libro = libroRepository.save(Libro.builder().titulo("Las ratas").numPaginas(200).autor(autor).build());
        Anotacion cita = anotacionRepository.save(Anotacion.builder().usuario(luis).libro(libro)
                .tipo(TipoAnotacion.CITA).esPublica(true).tieneSpoiler(false).texto("Una cita bonita")
                .fecha(LocalDateTime.now()).build());

        mockMvc.perform(post("/api/citas/" + cita.getIdanotacion() + "/guardar").header("Authorization", token(ana)))
                .andExpect(status().isNoContent());

        // En el muro sale marcada
        mockMvc.perform(get("/api/citas").header("Authorization", token(ana)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.citas[?(@.idanotacion == " + cita.getIdanotacion() + ")].guardada").value(true));

        // En su mural (lo que pide la pestaña del perfil)
        mockMvc.perform(get("/api/citas/guardadas/usuario/" + ana.getIdusuario()).param("page", "0").param("size", "20")
                        .header("Authorization", token(ana)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.citas[0].texto").value("Una cita bonita"));

        // Y otro usuario que visita su perfil también la ve
        mockMvc.perform(get("/api/citas/guardadas/usuario/" + ana.getIdusuario()).header("Authorization", token(luis)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.citas[0].texto").value("Una cita bonita"));
    }
}
