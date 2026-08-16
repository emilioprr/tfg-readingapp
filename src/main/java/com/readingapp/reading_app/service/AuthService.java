package com.readingapp.reading_app.service;

import com.readingapp.reading_app.config.JwtUtil;
import com.readingapp.reading_app.dto.AuthDTO;
import com.readingapp.reading_app.dto.UsuarioDTO;
import com.readingapp.reading_app.model.Usuario;
import com.readingapp.reading_app.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UsuarioService usuarioService;

    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Email o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new IllegalArgumentException("Email o contraseña incorrectos");
        }

        String token = jwtUtil.generateToken(usuario.getIdusuario(), usuario.getEmail());

        return AuthDTO.AuthResponse.builder()
                .token(token)
                .idusuario(usuario.getIdusuario())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .build();
    }

    public AuthDTO.AuthResponse registro(UsuarioDTO.RegistroRequest request) {
        UsuarioDTO.Response usuario = usuarioService.registrar(request);

        String token = jwtUtil.generateToken(usuario.getIdusuario(), usuario.getEmail());

        return AuthDTO.AuthResponse.builder()
                .token(token)
                .idusuario(usuario.getIdusuario())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .build();
    }
}
