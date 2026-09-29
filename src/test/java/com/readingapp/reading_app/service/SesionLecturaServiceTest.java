package com.readingapp.reading_app.service;

import com.readingapp.reading_app.dto.SesionLecturaDTO;
import com.readingapp.reading_app.model.SesionLectura;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.LibroRepository;
import com.readingapp.reading_app.repository.SesionLecturaRepository;
import com.readingapp.reading_app.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SesionLecturaService - registro de sesiones de lectura")
class SesionLecturaServiceTest {

    @Mock private SesionLecturaRepository sesionLecturaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private LibroRepository libroRepository;
    @Mock private RetoService retoService;

    @InjectMocks private SesionLecturaService sesionLecturaService;

    @BeforeEach
    void setUp() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(Usuario.builder().idusuario(1L).nombre("ana").build()));
        lenient().when(sesionLecturaRepository.save(any(SesionLectura.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private SesionLecturaDTO.CreateRequest sesion(int minutos) {
        return SesionLecturaDTO.CreateRequest.builder().idusuario(1L).duracionMinutos(minutos).build();
    }

    @Test
    @DisplayName("Una sesión de hasta 12 horas se registra y actualiza los retos")
    void sesionValida() {
        assertThatCode(() -> sesionLecturaService.registrar(sesion(SesionLecturaDTO.MAX_MINUTOS_SESION)))
                .doesNotThrowAnyException();
        verify(retoService).recalcularRetosActivosDeUsuario(1L);
    }

    @Test
    @DisplayName("Una sesión de más de 12 horas se rechaza y no cuenta para los retos")
    void sesionDemasiadoLarga() {
        assertThatThrownBy(() -> sesionLecturaService.registrar(sesion(100_000)))
                .isInstanceOf(IllegalArgumentException.class);
        verify(sesionLecturaRepository, never()).save(any());
        verify(retoService, never()).recalcularRetosActivosDeUsuario(any());
    }
}
