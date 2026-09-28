package com.readingapp.reading_app.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/*Comprueba las reglas de SecurityConfig a nivel HTTP (con la base de datos H2 de los tests).*/
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("SecurityConfig - rutas públicas y protegidas")
class SecurityConfigTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtUtil jwtUtil;

    private String tokenUsuario() {
        return "Bearer " + jwtUtil.generateToken(1L, "ana@test.com", "USER");
    }

    private void assertRechazada(int status) {
        assertThat(status).as("la petición debería rechazarse con 401 o 403").isIn(401, 403);
    }

    @Test
    @DisplayName("sin sesión no se puede buscar en Google Books")
    void googleBooksRequiereSesion() throws Exception {
        int status = mockMvc.perform(get("/api/libros/buscar/google").param("q", "dune"))
                .andReturn().getResponse().getStatus();
        assertRechazada(status);
    }

    @Test
    @DisplayName("sin sesión no se pueden importar libros de Google Books")
    void importarRequiereSesion() throws Exception {
        int status = mockMvc.perform(post("/api/libros/importar/google/abc123"))
                .andReturn().getResponse().getStatus();
        assertRechazada(status);
    }

    @Test
    @DisplayName("sin sesión no se accede a rutas privadas (recomendaciones)")
    void rutaPrivadaRequiereSesion() throws Exception {
        int status = mockMvc.perform(get("/api/recomendaciones/recibidas/1"))
                .andReturn().getResponse().getStatus();
        assertRechazada(status);
    }

    @Test
    @DisplayName("un usuario normal no puede usar la carga de datos (solo admin)")
    void cargaSoloAdmin() throws Exception {
        int status = mockMvc.perform(post("/api/carga/libros").header("Authorization", tokenUsuario()))
                .andReturn().getResponse().getStatus();
        assertRechazada(status);
    }

    @Test
    @DisplayName("las rutas públicas responden sin sesión")
    void rutaPublicaSinSesion() throws Exception {
        mockMvc.perform(get("/api/auth/health")).andExpect(status().isOk());
    }
}
