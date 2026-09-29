package com.readingapp.reading_app.config;

/*Demasiados intentos fallidos de inicio de sesión: se responde con 429 (Too Many Requests).*/
public class DemasiadosIntentosException extends RuntimeException {
    public DemasiadosIntentosException(String mensaje) {
        super(mensaje);
    }
}
