import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const ID_SISTEMA = 'sistema'

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
        <div className={`${size} bg-terra/20 rounded-full flex items-center justify-center text-terra font-bold flex-shrink-0`}>
            {nombre?.charAt(0).toUpperCase()}
        </div>
    )
}

function IconoCarta({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
    )
}

/** Agrupa las recomendaciones por la otra persona; la conversación más reciente primero. */
function agrupar(todas, idUsuario) {
    const mapa = {}
    todas.forEach((r) => {
        const enviada = r.idusuarioEmisor === idUsuario
        const id = enviada ? r.idusuarioReceptor : (r.idusuarioEmisor ?? ID_SISTEMA)
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
            } catch (err) { console.error('Error:', err) } finally { setLoading(false) }
        }
        cargar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario.id])

    useEffect(() => {
        finChatRef.current?.scrollIntoView({ block: 'end' })
    }, [seleccionadoId])

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    if (conversaciones.length === 0) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-dark-text mb-6 tracking-tight">Recomendaciones</h1>
                <div className="bg-dark-card rounded-2xl py-16 px-6 text-center">
                    <IconoCarta className="w-12 h-12 text-terra/60 mx-auto mb-4" />
                    <p className="text-dark-text font-medium">Aún no hay recomendaciones</p>
                    <p className="text-dark-muted text-sm mt-1 mb-5">
                        Cuando alguien te recomiende un libro, o tú se lo recomiendes a alguien, aparecerá aquí.
                    </p>
                    <Link to="/catalogo" className="text-terra hover:text-terra-hover text-sm font-medium transition-colors">
                        Buscar un libro para recomendar
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text mb-6 tracking-tight">Recomendaciones</h1>

            <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[420px]">
                {/* Lista de conversaciones */}
                <div className={`w-full md:w-80 flex-shrink-0 bg-dark-card rounded-2xl overflow-y-auto p-2 ${seleccionado ? 'hidden md:block' : ''}`}>
                    {conversaciones.map((c) => {
                        const activa = seleccionado?.id === c.id
                        const ultimaEnviada = c.ultima.idusuarioEmisor === usuario.id
                        return (
                            <button key={c.id} onClick={() => abrir(c)}
                                    className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-colors ${activa ? 'bg-dark-elevated' : 'hover:bg-dark-elevated/60'}`}>
                                <Avatar nombre={c.nombre} avatar={c.avatar} size="w-11 h-11 text-base" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className={`text-sm truncate ${c.noVistas ? 'text-dark-text font-semibold' : 'text-dark-text font-medium'}`}>{c.nombre}</p>
                                        <span className={`text-[11px] flex-shrink-0 ${c.noVistas ? 'text-terra' : 'text-dark-muted'}`}>{fechaCorta(c.ultima.fecha)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className={`text-xs truncate ${c.noVistas ? 'text-dark-text' : 'text-dark-muted'}`}>
                                            {ultimaEnviada && <span className="text-dark-muted">Tú: </span>}
                                            {c.ultima.tituloLibro}
                                        </p>
                                        {c.noVistas > 0 && (
                                            <span className="bg-terra text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center flex-shrink-0">
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
                <div className={`flex-1 bg-dark-card rounded-2xl flex-col overflow-hidden ${seleccionado ? 'flex' : 'hidden md:flex'}`}>
                    {!seleccionado ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                            <IconoCarta className="w-10 h-10 text-dark-muted/50 mb-3" />
                            <p className="text-dark-muted text-sm">Elige una conversación</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-5 py-3.5 border-b border-dark-border flex items-center gap-3">
                                <button onClick={() => setSeleccionadoId(null)} className="md:hidden text-dark-muted hover:text-dark-text -ml-1 mr-1" title="Volver">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <Avatar nombre={seleccionado.nombre} avatar={seleccionado.avatar} size="w-9 h-9 text-sm" />
                                <div className="min-w-0">
                                    {seleccionado.id === ID_SISTEMA ? (
                                        <p className="text-dark-text font-semibold text-sm">{seleccionado.nombre}</p>
                                    ) : (
                                        <Link to={`/usuario/${seleccionado.id}`} className="text-dark-text font-semibold text-sm hover:text-terra transition-colors">
                                            {seleccionado.nombre}
                                        </Link>
                                    )}
                                    <p className="text-dark-muted text-xs">
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
                                                    <span className="text-[11px] text-dark-muted bg-dark-elevated px-3 py-1 rounded-full">{etiquetaDia(m.fecha)}</span>
                                                </div>
                                            )}
                                            <div className={`flex mb-3 ${esMio ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`w-72 max-w-[85%] rounded-2xl p-3 ${esMio
                                                    ? 'bg-terra/15 border border-terra/25 rounded-br-md'
                                                    : 'bg-dark-elevated border border-dark-border rounded-bl-md'}`}>
                                                    <Link to={`/libro/${m.idlibro}`} className="group flex gap-3">
                                                        {m.portadaLibro ? (
                                                            <img src={m.portadaLibro} alt={m.tituloLibro} className="w-14 h-20 object-cover rounded-sm shadow-md flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-14 h-20 bg-dark-border rounded-sm flex-shrink-0" />
                                                        )}
                                                        <div className="min-w-0 py-0.5">
                                                            <p className="text-[11px] uppercase tracking-wide text-dark-muted mb-1">
                                                                {esMio ? 'Recomendaste' : 'Te recomienda'}
                                                            </p>
                                                            <p className="text-dark-text font-semibold text-sm leading-snug line-clamp-2 group-hover:text-terra transition-colors">
                                                                {m.tituloLibro}
                                                            </p>
                                                            {m.nombreAutorLibro && <p className="text-dark-muted text-xs mt-0.5 truncate">{m.nombreAutorLibro}</p>}
                                                        </div>
                                                    </Link>
                                                    {m.mensaje && (
                                                        <p className="text-dark-text/90 text-sm mt-3 leading-relaxed whitespace-pre-line">{m.mensaje}</p>
                                                    )}
                                                    <p className="text-[11px] text-dark-muted mt-2 text-right">
                                                        {new Date(m.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={finChatRef} />
                            </div>

                            <div className="px-5 py-3 border-t border-dark-border flex items-center justify-center gap-2 text-xs text-dark-muted">
                                <IconoCarta className="w-4 h-4" />
                                <span>Para recomendar un libro, pulsa «Recomendar» en su página.</span>
                                <Link to="/catalogo" className="text-terra hover:text-terra-hover font-medium transition-colors">Buscar libro</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
