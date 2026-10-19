import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { CaretLeft, EnvelopeSimple } from '@phosphor-icons/react'
import Portada from '../components/Portada'
import { useAvisos } from '../context/AvisosContext'

const mismoDia = (a, b) => a.toDateString() === b.toDateString()

/** "Hoy", "Ayer" o fecha corta, para separadores del chat y la lista. */
const etiquetaDia = (fecha) => {
    const d = new Date(fecha)
    const hoy = new Date()
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1)
    if (mismoDia(d, hoy)) return 'Hoy'
    if (mismoDia(d, ayer)) return 'Ayer'
    return d.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: d.getFullYear() === hoy.getFullYear() ? undefined : 'numeric',
    })
}

/** En la lista: la hora si es de hoy, si no el día. */
const fechaCorta = (fecha) => {
    const d = new Date(fecha)
    return mismoDia(d, new Date())
        ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        : etiquetaDia(fecha)
}

function Avatar({ nombre, avatar, size = 'w-10 h-10 text-base' }) {
    return avatar ? (
        <img src={avatar} alt={nombre} className={`${size} rounded-full object-cover flex-shrink-0`} />
    ) : (
        <div className={`${size} border border-linea rounded-full flex items-center justify-center text-texto-sec font-serif flex-shrink-0`}>
            {nombre?.charAt(0).toUpperCase()}
        </div>
    )
}

function IconoCarta({ className }) {
    return <EnvelopeSimple className={className} weight="light" />
}

/** Agrupa las recomendaciones por la otra persona; la conversación más reciente primero. */
function agrupar(todas, idUsuario) {
    const mapa = {}
    todas.forEach((r) => {
        const enviada = r.idusuarioEmisor === idUsuario
        const id = enviada ? r.idusuarioReceptor : r.idusuarioEmisor
        if (!mapa[id]) {
            mapa[id] = {
                id,
                nombre: enviada ? r.nombreReceptor : r.nombreEmisor,
                avatar: enviada ? r.avatarReceptor : r.avatarEmisor,
                mensajes: [],
            }
        }
        mapa[id].mensajes.push(r)
    })
    return Object.values(mapa).map((c) => {
        c.mensajes.sort((a, b) => a.fecha.localeCompare(b.fecha))
        c.ultima = c.mensajes[c.mensajes.length - 1]
        c.noVistas = c.mensajes.filter(m => m.idusuarioReceptor === idUsuario && !m.visto).length
        return c
    }).sort((a, b) => b.ultima.fecha.localeCompare(a.ultima.fecha))
}

export default function Recomendaciones() {
    const { avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const [todas, setTodas] = useState([])
    const [seleccionadoId, setSeleccionadoId] = useState(null)
    const [loading, setLoading] = useState(true)
    const finChatRef = useRef(null)

    const conversaciones = agrupar(todas, usuario.id)
    const seleccionado = conversaciones.find(c => c.id === seleccionadoId)

    /** Abre una conversación y marca como vistas las recomendaciones recibidas en ella. */
    const abrir = async (conversacion) => {
        setSeleccionadoId(conversacion.id)
        const pendientes = conversacion.mensajes.filter(m => m.idusuarioReceptor === usuario.id && !m.visto)
        if (pendientes.length === 0) return
        try {
            await Promise.all(pendientes.map(m => api.put(`/recomendaciones/${m.idrecomendacion}/vista`)))
            const ids = new Set(pendientes.map(m => m.idrecomendacion))
            setTodas(prev => prev.map(m => ids.has(m.idrecomendacion) ? { ...m, visto: true } : m))
        } catch (err) { console.error('Error:', err) }
    }

    useEffect(() => {
        const cargar = async () => {
            try {
                const [recRes, envRes] = await Promise.all([
                    api.get(`/recomendaciones/recibidas/${usuario.id}`),
                    api.get(`/recomendaciones/enviadas/${usuario.id}`),
                ])
                const datos = [...(recRes.data.content || recRes.data || []), ...(envRes.data.content || envRes.data || [])]
                setTodas(datos)
                // En escritorio se abre la conversación más reciente al entrar
                const primera = agrupar(datos, usuario.id)[0]
                if (primera && window.matchMedia('(min-width: 768px)').matches) abrir(primera)
            } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar tus recomendaciones.') } finally { setLoading(false) }
        }
        cargar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario])

    useEffect(() => {
        finChatRef.current?.scrollIntoView({ block: 'end' })
    }, [seleccionadoId])

    if (loading) return <p className="text-texto-sec">Cargando…</p>

    if (conversaciones.length === 0) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="font-serif text-4xl leading-none text-texto mb-6">Recomendaciones</h1>
                <div className="border-y border-linea py-10">
                    <p className="font-serif text-2xl text-texto">Nadie te ha pasado un libro todavía.</p>
                    <p className="text-texto-sec text-sm mt-2 mb-6 max-w-prose">
                        Cuando alguien te recomiende uno, o tú se lo recomiendes a alguien, la conversación aparecerá aquí.
                    </p>
                    <Link to="/catalogo" className="btn-secundario">Buscar un libro para recomendar</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-4xl leading-none text-texto mb-6">Recomendaciones</h1>

            <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[420px]">
                {/* Lista de conversaciones */}
                <div className={`w-full md:w-80 flex-shrink-0 border border-linea rounded overflow-y-auto p-1.5 ${seleccionado ? 'hidden md:block' : ''}`}>
                    {conversaciones.map((c) => {
                        const activa = seleccionado?.id === c.id
                        const ultimaEnviada = c.ultima.idusuarioEmisor === usuario.id
                        return (
                            <button key={c.id} onClick={() => abrir(c)}
                                    className={`w-full text-left px-3 py-3 rounded flex items-center gap-3 ${activa ? 'bg-superficie' : 'hover:bg-superficie/60'}`}>
                                <Avatar nombre={c.nombre} avatar={c.avatar} size="w-11 h-11 text-base" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className={`text-sm truncate ${c.noVistas ? 'text-texto font-semibold' : 'text-texto font-medium'}`}>{c.nombre}</p>
                                        <span className={`text-[11px] flex-shrink-0 ${c.noVistas ? 'text-acento' : 'text-texto-sec'}`}>{fechaCorta(c.ultima.fecha)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className={`text-xs truncate ${c.noVistas ? 'text-texto' : 'text-texto-sec'}`}>
                                            {ultimaEnviada && <span className="text-texto-sec">Tú: </span>}
                                            {c.ultima.tituloLibro}
                                        </p>
                                        {c.noVistas > 0 && (
                                            <span className="bg-acento text-fondo text-[10px] font-semibold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center flex-shrink-0">
                                                {c.noVistas}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Conversación */}
                <div className={`flex-1 border border-linea rounded flex-col overflow-hidden ${seleccionado ? 'flex' : 'hidden md:flex'}`}>
                    {!seleccionado ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                            <IconoCarta className="w-10 h-10 text-texto-ter mb-3" />
                            <p className="font-serif text-xl text-texto-sec">Elige una conversación</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-5 py-3.5 border-b border-linea flex items-center gap-3">
                                <button onClick={() => setSeleccionadoId(null)} className="md:hidden text-texto-sec hover:text-texto -ml-1 mr-1" title="Volver">
                                    <CaretLeft size={20} />
                                </button>
                                <Avatar nombre={seleccionado.nombre} avatar={seleccionado.avatar} size="w-9 h-9 text-sm" />
                                <div className="min-w-0">
                                    <Link to={`/usuario/${seleccionado.id}`} className="text-texto font-semibold text-sm hover:text-acento transition-colors">
                                        {seleccionado.nombre}
                                    </Link>
                                    <p className="text-texto-sec text-xs">
                                        {seleccionado.mensajes.length} {seleccionado.mensajes.length === 1 ? 'libro recomendado' : 'libros recomendados'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-4">
                                {seleccionado.mensajes.map((m, i) => {
                                    const esMio = m.idusuarioEmisor === usuario.id
                                    const anterior = seleccionado.mensajes[i - 1]
                                    const nuevoDia = !anterior || !mismoDia(new Date(anterior.fecha), new Date(m.fecha))
                                    return (
                                        <div key={m.idrecomendacion}>
                                            {nuevoDia && (
                                                <div className="flex justify-center my-4">
                                                    <span className="etiqueta text-texto-ter">{etiquetaDia(m.fecha)}</span>
                                                </div>
                                            )}
                                            <div className={`flex mb-3 ${esMio ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`w-72 max-w-[85%] rounded p-3 border ${esMio
                                                    ? 'bg-acento-suave/70 border-acento-suave'
                                                    : 'bg-superficie border-linea'}`}>
                                                    <Link to={`/libro/${m.idlibro}`} className="group flex gap-3">
                                                        <Portada src={m.portadaLibro} titulo={m.tituloLibro} autor={m.nombreAutorLibro} id={m.idlibro}
                                                                 className="w-14 flex-shrink-0" />
                                                        <div className="min-w-0 py-0.5">
                                                            <p className="etiqueta mb-1">
                                                                {esMio ? 'Recomendaste' : 'Te recomienda'}
                                                            </p>
                                                            <p className="font-serif text-texto leading-snug line-clamp-2 group-hover:text-acento">
                                                                {m.tituloLibro}
                                                            </p>
                                                            {m.nombreAutorLibro && <p className="text-texto-sec text-xs mt-0.5 truncate">{m.nombreAutorLibro}</p>}
                                                        </div>
                                                    </Link>
                                                    {m.mensaje && (
                                                        <p className="font-serif text-texto/90 text-[15px] mt-3 leading-relaxed whitespace-pre-line">{m.mensaje}</p>
                                                    )}
                                                    <p className="text-[11px] text-texto-ter mt-2 text-right">
                                                        {new Date(m.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={finChatRef} />
                            </div>

                            <div className="px-5 py-3 border-t border-linea flex items-center justify-center gap-2 text-xs text-texto-sec">
                                <IconoCarta className="w-4 h-4" />
                                <span>Para recomendar un libro, pulsa «Recomendar» en su página.</span>
                                <Link to="/catalogo" className="text-acento hover:text-acento-hover font-medium transition-colors">Buscar libro</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
