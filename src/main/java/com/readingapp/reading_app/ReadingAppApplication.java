package com.readingapp.reading_app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class ReadingAppApplication {

	/*Zona horaria de la app: las fechas de lectura (rachas, retos) se calculan con la hora de España,
	  aunque el servidor (Render) esté en UTC.*/
	public static final String ZONA_HORARIA = "Europe/Madrid";

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone(ZONA_HORARIA));
		SpringApplication.run(ReadingAppApplication.class, args);
	}

}
