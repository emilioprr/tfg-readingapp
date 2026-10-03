import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Portada from './Portada'
import { useAvisos } from '../context/AvisosContext'

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
        <div className="w-9 h-9 bg-superficie border border-linea rounded-full flex items-center justify-center text-texto-sec text-sm font-serif flex-shrink-0">
            {e.nombreUsuario?.charAt(0).toUpperCase()}
        </div>
    )
}

/** Frase del evento: "ha terminado Las ratas", "ha conseguido el reto…". */
function Descripcion({ e }) {
    const libro = <Link to={`/libro/${e.idlibro}`} className="font-serif italic text-texto hover:text-acento">{e.tituloLibro}</Link>
    switch (e.tipo) {
        case 'EMPEZO': return <>ha empezado a leer {libro}</>
        case 'TERMINO': return <>ha terminado {libro}</>
        case 'QUIERE_LEER': return <>quiere leer {libro}</>
        case 'RESENA': return (
            <>
                ha <Link to={`/resena/${e.idresena}`} className="hover:text-acento transition-colors underline decoration-linea underline-offset-2">reseñado</Link> {libro}
                {e.puntuacion != null && <span className="text-acento ml-1.5">★ {Number(e.puntuacion).toLocaleString('es-ES')}</span>}
            </>
        )
        case 'RETO_CONSEGUIDO': return (
            <>ha conseguido el reto <Link to="/retos" className="text-texto hover:text-acento">«{e.tituloReto}»</Link></>
        )
        default: return null
    }
}

/** Feed del inicio: lo que están leyendo, terminando y consiguiendo las personas que sigues. */
/** Una línea del feed: quién, qué ha hecho, cuándo y la portada del libro. */
export function FilaActividad({ e }) {
    return (
        <div className="group/fila flex items-center gap-3 py-3.5">
            <Link to={`/usuario/${e.idusuario}`}><Avatar e={e} /></Link>
            <p className="flex-1 min-w-0 text-sm text-texto-sec leading-snug">
                <Link to={`/usuario/${e.idusuario}`} className="text-texto font-medium hover:text-acento">
                    {e.nombreUsuario}
                </Link>{' '}
                <Descripcion e={e} />
                <span className="block text-[11px] text-texto-ter mt-1">{haceCuanto(e.fecha)}</span>
            </p>
            {e.idlibro && (
                <Link to={`/libro/${e.idlibro}`} className="group flex-shrink-0">
                    <Portada src={e.portadaLibro} titulo={e.tituloLibro} id={e.idlibro} className="w-9" />
                </Link>
            )}
        </div>
    )
}

/** Clave estable de un evento para las listas de React. */
const claveEvento = (e) => `${e.tipo}-${e.idusuario}-${e.idlibro ?? e.idreto}-${e.idresena ?? ''}-${e.fecha}`

/** Sección del inicio: los últimos eventos y un enlace a la página con toda la actividad. */
export default function ActividadSeguidos() {
    const { avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const [datos, setDatos] = useState(null)

    useEffect(() => {
        if (!usuario) return
        api.get(`/actividad/seguidos/${usuario.id}?page=0&size=${EN_INICIO}`)
            .then(res => setDatos(res.data))
            // Si falla no se muestra la sección (mejor que un "no hay actividad" que no es cierto)
            .catch(err => { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar la actividad de las personas que sigues.') })
    }, [avisarCarga, usuario])

    if (!datos) return null
    const eventos = datos.eventos || []

    return (
        <section className="border-t border-linea pt-8 mb-12">
            <div className="flex items-baseline justify-between mb-4">
                <h2 className="etiqueta">Actividad de las personas que sigues</h2>
                {datos.hayMas && (
                    <Link to="/actividad" className="text-xs text-texto-sec hover:text-acento">Ver toda la actividad</Link>
                )}
            </div>
            {eventos.length === 0 ? (
                <div className="py-6">
                    <p className="font-serif text-xl text-texto">Todavía no sigues a nadie que esté leyendo.</p>
                    <p className="text-texto-sec text-sm mt-1">
                        Aquí verás qué empiezan, qué terminan y qué retos consiguen. Busca lectores en el buscador, en «Usuarios».
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-linea max-w-3xl">
                    {eventos.map((e) => <FilaActividad key={claveEvento(e)} e={e} />)}
                </div>
            )}
        </section>
    )
}
