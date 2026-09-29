import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const EN_INICIO = 5

/** "Hoy", "Ayer", "hace 3 días"… a partir de una fecha ISO. */
function haceCuanto(fechaIso) {
    const dia = new Date(fechaIso.slice(0, 10) + 'T00:00:00')
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const dias = Math.round((hoy - dia) / 86400000)
    if (dias <= 0) return 'Hoy'
    if (dias === 1) return 'Ayer'
    if (dias < 7) return `Hace ${dias} días`
    return dia.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function Avatar({ e }) {
    return e.avatarUsuario ? (
        <img src={e.avatarUsuario} alt={e.nombreUsuario} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
    ) : (
        <div className="w-9 h-9 bg-terra/20 rounded-full flex items-center justify-center text-terra text-sm font-bold flex-shrink-0">
            {e.nombreUsuario?.charAt(0).toUpperCase()}
        </div>
    )
}

/** Frase del evento: "ha terminado Las ratas", "ha conseguido el reto…". */
function Descripcion({ e }) {
    const libro = <Link to={`/libro/${e.idlibro}`} className="text-dark-text font-medium hover:text-terra transition-colors">{e.tituloLibro}</Link>
    switch (e.tipo) {
        case 'EMPEZO': return <>ha empezado a leer {libro}</>
        case 'TERMINO': return <>ha terminado {libro} 🎉</>
        case 'QUIERE_LEER': return <>quiere leer {libro}</>
        case 'RESENA': return (
            <>
                ha <Link to={`/resena/${e.idresena}`} className="hover:text-terra transition-colors underline decoration-dark-border underline-offset-2">reseñado</Link> {libro}
                {e.puntuacion != null && <span className="text-terra font-semibold ml-1.5">★ {Number(e.puntuacion).toLocaleString('es-ES')}</span>}
            </>
        )
        case 'RETO_CONSEGUIDO': return (
            <>ha conseguido el reto <Link to="/retos" className="text-dark-text font-medium hover:text-terra transition-colors">«{e.tituloReto}»</Link> 🏆</>
        )
        default: return null
    }
}

/** Feed del inicio: lo que están leyendo, terminando y consiguiendo las personas que sigues. */
/** Una línea del feed: quién, qué ha hecho, cuándo y la portada del libro. */
export function FilaActividad({ e }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <Link to={`/usuario/${e.idusuario}`}><Avatar e={e} /></Link>
            <p className="flex-1 min-w-0 text-sm text-dark-muted leading-snug">
                <Link to={`/usuario/${e.idusuario}`} className="text-dark-text font-semibold hover:text-terra transition-colors">
                    {e.nombreUsuario}
                </Link>{' '}
                <Descripcion e={e} />
                <span className="block text-[11px] text-dark-muted/70 mt-0.5">{haceCuanto(e.fecha)}</span>
            </p>
            {e.idlibro && (
                <Link to={`/libro/${e.idlibro}`} className="flex-shrink-0">
                    {e.portadaLibro ? (
                        <img src={e.portadaLibro} alt={e.tituloLibro} className="w-8 h-12 object-cover rounded-sm" />
                    ) : (
                        <div className="w-8 h-12 bg-dark-elevated rounded-sm" />
                    )}
                </Link>
            )}
        </div>
    )
}

/** Clave estable de un evento para las listas de React. */
const claveEvento = (e) => `${e.tipo}-${e.idusuario}-${e.idlibro ?? e.idreto}-${e.idresena ?? ''}-${e.fecha}`

/** Sección del inicio: los últimos eventos y un enlace a la página con toda la actividad. */
export default function ActividadSeguidos() {
    const { usuario } = useAuth()
    const [datos, setDatos] = useState(null)

    useEffect(() => {
        if (!usuario) return
        api.get(`/actividad/seguidos/${usuario.id}?page=0&size=${EN_INICIO}`)
            .then(res => setDatos(res.data))
            // Si falla no se muestra la sección (mejor que un "no hay actividad" que no es cierto)
            .catch(err => console.error('Error:', err))
    }, [usuario])

    if (!datos) return null
    const eventos = datos.eventos || []

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-dark-text">Actividad de las personas que sigues</h2>
                {datos.hayMas && (
                    <Link to="/actividad" className="text-xs text-dark-muted hover:text-terra transition-colors">Ver toda la actividad</Link>
                )}
            </div>
            {eventos.length === 0 ? (
                <div className="bg-dark-card rounded-2xl p-6 text-center">
                    <p className="text-dark-muted text-sm">
                        Aquí verás qué empiezan a leer, qué terminan y qué retos consiguen las personas que sigues.
                    </p>
                    <p className="text-dark-muted/70 text-xs mt-1">
                        Puedes encontrar lectores en el buscador, en la pestaña «Usuarios».
                    </p>
                </div>
            ) : (
                <div className="bg-dark-card rounded-2xl divide-y divide-dark-border">
                    {eventos.map((e) => <FilaActividad key={claveEvento(e)} e={e} />)}
                </div>
            )}
        </section>
    )
}
