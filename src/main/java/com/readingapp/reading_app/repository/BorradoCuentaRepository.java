package com.readingapp.reading_app.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Borra una cuenta de usuario con todo lo que depende de ella, en el orden que exigen las claves
 * foráneas: primero lo que cuelga de sus reseñas, recomendaciones, retos y listas; al final el usuario.
 * Debe llamarse dentro de una transacción (lo hace UsuarioService).
 */
@Repository
public class BorradoCuentaRepository {

    @PersistenceContext
    private EntityManager entityManager;

    private static final String SUS_RESENAS = "(SELECT idresena FROM resena WHERE idusuario = :id)";
    private static final String SUS_RECOMENDACIONES =
            "(SELECT idrecomendacion FROM recomendacion WHERE idusuario_emisor = :id OR idusuario_receptor = :id)";
    private static final String SUS_RETOS = "(SELECT idreto FROM reto WHERE id_creador = :id)";

    private static final List<String> SENTENCIAS = List.of(
            // Notificaciones suyas, provocadas por él o que apuntan a algo que se va a borrar
            "DELETE FROM notificacion WHERE idusuario = :id OR idusuario_origen = :id " +
                    "OR idresena IN " + SUS_RESENAS + " OR idrecomendacion IN " + SUS_RECOMENDACIONES +
                    " OR idreto IN " + SUS_RETOS +
                    " OR idanotacion IN (SELECT idanotacion FROM anotacion WHERE idusuario = :id)",
            // Reseñas: likes (suyos y de otros a sus reseñas), etiquetas y las propias reseñas
            "DELETE FROM likea WHERE idusuario = :id OR idresena IN " + SUS_RESENAS,
            "DELETE FROM resena_etiqueta WHERE idresena IN " + SUS_RESENAS,
            "DELETE FROM resena WHERE idusuario = :id",
            "DELETE FROM recomendacion WHERE idusuario_emisor = :id OR idusuario_receptor = :id",
            "DELETE FROM valoracion WHERE idusuario = :id",
            // Retos: su participación en retos de otros y los retos que creó (con sus participantes)
            "DELETE FROM participante_reto WHERE id_usuario = :id OR id_reto IN " + SUS_RETOS,
            "DELETE FROM reto WHERE id_creador = :id",
            // Listas y actividad de lectura
            "DELETE FROM lista_libro WHERE idlista IN (SELECT idlista FROM lista WHERE idusuario = :id)",
            "DELETE FROM lista WHERE idusuario = :id",
            // Citas guardadas: las que guardó él y las suyas que guardaron otros
            "DELETE FROM cita_guardada WHERE idusuario = :id " +
                    "OR idanotacion IN (SELECT idanotacion FROM anotacion WHERE idusuario = :id)",
            // Likes a citas: los que dio él y los que recibieron sus citas
            "DELETE FROM like_cita WHERE idusuario = :id " +
                    "OR idanotacion IN (SELECT idanotacion FROM anotacion WHERE idusuario = :id)",
            "DELETE FROM anotacion WHERE idusuario = :id",
            "DELETE FROM favorito WHERE idusuario = :id",
            "DELETE FROM seguimiento WHERE idusuario = :id",
            "DELETE FROM sesion_lectura WHERE id_usuario = :id",
            // Relaciones sociales: a los autores que seguía se les resta ese seguidor
            "UPDATE autor SET seguidores = GREATEST(seguidores - 1, 0) " +
                    "WHERE idautor IN (SELECT idautor FROM sigue_autor WHERE idusuario = :id)",
            "DELETE FROM sigue_autor WHERE idusuario = :id",
            "DELETE FROM sigue WHERE idusuario_seguidor = :id OR idusuario_seguido = :id",
            "DELETE FROM usuario_dia_protegido WHERE idusuario = :id",
            "DELETE FROM usuario WHERE idusuario = :id"
    );

    public void borrarCuenta(Long idusuario) {
        entityManager.flush();
        for (String sql : SENTENCIAS) {
            entityManager.createNativeQuery(sql).setParameter("id", idusuario).executeUpdate();
        }
        // Las entidades en memoria ya no existen en la base de datos
        entityManager.clear();
    }
}
