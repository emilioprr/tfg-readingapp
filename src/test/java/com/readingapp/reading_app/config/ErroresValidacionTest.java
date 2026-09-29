package com.readingapp.reading_app.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/*Los errores de validación llevan un "mensaje" legible, que es lo que muestra el frontend.*/
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("GlobalExceptionHandler - errores de validación con mensaje")
class ErroresValidacionTest {

    @Autowired private MockMvc mockMvc;

    @Test
    @DisplayName("Registrarse con una contraseña corta dice por qué falla")
    void contrasenaCorta() throws Exception {
        mockMvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"nuevo\",\"email\":\"nuevo@test.com\",\"password\":\"12345\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value(containsString("al menos 6 caracteres")))
                .andExpect(jsonPath("$.errores.password").exists());
    }
}
