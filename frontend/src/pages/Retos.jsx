import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Check } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Pestanas from '../components/Pestanas'
import { Sello } from '../components/Racha'
import { useAvisos } from '../context/AvisosContext'
import { formatoProgreso } from '../utils/retos'

const MODALIDAD = { PERSONAL: 'Personal', COMPARTIDO: 'Con amigos', PREDEFINIDO: 'Oficial', COLABORATIVO: 'Colaborativo' }
const TIPO = { LIBROS: 'Libros', PAGINAS: 'Páginas', HORAS: 'Horas' }
const UNIDAD = { LIBROS: 'libros', PAGINAS: 'páginas', HORAS: 'horas' }

/** Línea fina de progreso, como la de lectura. */
function BarraProgreso({ porcentaje = 0 }) {
    return (
        <div className="relative h-[2px] bg-linea">
            <div className="absolute inset-y-0 left-0 bg-acento transition-[width] duration-500" style={{ width: `${Math.min(100, porcentaje)}%` }} />
        </div>
    )
}

/** Tipo y modalidad, como texto discreto. */
function Etiquetas({ tipo, modalidad }) {
    return (
        <p className="text-xs text-texto-sec mt-1">
            {TIPO[tipo] || tipo} <span className="text-texto-ter">·</span> {MODALIDAD[modalidad] || modalidad}
        </p>
    )
}

function ParticipantesReto({ idreto }) {
    const [participantes, setParticipantes] = useState(null)

    useEffect(() => {
        api.get(`/retos/${idreto}`)
            .then(res => setParticipantes([...(res.data.participantes || [])].sort((a, b) => (b.porcentaje || 0) - (a.porcentaje || 0))))
            .catch(() => setParticipantes([]))
    }, [idreto])

    if (participantes === null) return <p className="text-texto-sec text-xs mt-4">Cargando participantes…</p>
    if (participantes.length === 0) return <p className="text-texto-sec text-xs mt-4">Todavía no se ha apuntado nadie más.</p>

    return (
        <div className="mt-5 space-y-3 border-t border-linea pt-4">
            {participantes.map((p, i) => (
                <div key={p.idparticipante} className="flex items-center gap-3">
                    <span className="text-texto-ter text-xs w-4 tabular-nums">{i + 1}</span>
                    <Link to={`/usuario/${p.idusuario}`} className="text-texto text-sm hover:text-acento w-28 truncate">
                        {p.nombreUsuario}
                    </Link>
                    <div className="flex-1"><BarraProgreso porcentaje={p.porcentaje} /></div>
                    <span className="text-texto-sec text-xs w-20 text-right flex items-center justify-end gap-1">
                        {p.retoCumplido ? <><Check size={12} className="text-exito" /> Cumplido</> : `${p.porcentaje || 0}%`}
                    </span>
                </div>
            ))}
        </div>
    )
}

function TarjetaActivo({ p, onAbandonar }) {
    const [verParticipantes, setVerParticipantes] = useState(false)
    const esGrupal = p.modalidadReto !== 'PERSONAL'

    return (
        <article className="py-6 border-b border-linea">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="font-serif text-xl leading-snug text-texto">{p.tituloReto}</h3>
                    <Etiquetas tipo={p.tipoReto} modalidad={p.modalidadReto} />
                </div>
                {/* Un reto personal es un compromiso contigo mismo: no se abandona */}
                {esGrupal && (
                    <button onClick={() => onAbandonar(p.idreto)} className="text-texto-ter hover:text-error text-xs flex-shrink-0">
                        Abandonar
                    </button>
                )}
            </div>
            <p className="font-serif text-3xl leading-none text-texto mt-5 tabular-nums">
                {formatoProgreso(p.tipoReto, p.progreso, p.meta)}
                <span className="font-sans text-xs text-texto-ter ml-3">{p.porcentaje || 0}%</span>
            </p>
            <div className="mt-4"><BarraProgreso porcentaje={p.porcentaje} /></div>
            {esGrupal && (
                <button onClick={() => setVerParticipantes(v => !v)} className="text-xs text-texto-sec hover:text-texto mt-3">
                    {verParticipantes ? 'Ocultar participantes' : 'Ver participantes'}
                </button>
            )}
            {verParticipantes && <ParticipantesReto idreto={p.idreto} />}
        </article>
    )
}

function TarjetaExplorar({ reto, onUnirse }) {
    return (
        <article className="py-6 border-b border-linea">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="font-serif text-xl leading-snug text-texto">{reto.titulo}</h3>
                    {reto.descripcion && <p className="text-texto-sec text-sm mt-1 max-w-prose">{reto.descripcion}</p>}
                    <Etiquetas tipo={reto.tipo} modalidad={reto.modalidad} />
                    <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-texto-ter mt-2">
                        <span>Meta: {reto.meta}{reto.tipo === 'HORAS' ? ' h' : ''}</span>
                        {reto.fechaFin && <span>Hasta el {new Date(reto.fechaFin).toLocaleDateString('es-ES')}</span>}
                        <span>{reto.numParticipantes || 0} {reto.numParticipantes === 1 ? 'participante' : 'participantes'}</span>
                        {reto.modalidad === 'COMPARTIDO' && reto.nombreCreador && <span>Lo propone {reto.nombreCreador}</span>}
                    </p>
                </div>
                <button onClick={() => onUnirse(reto.idreto)} className="btn-acento flex-shrink-0">Unirme</button>
            </div>
            {reto.modalidad === 'COLABORATIVO' && (
                <div className="mt-5">
                    <p className="etiqueta mb-2">Progreso de la comunidad</p>
                    <BarraProgreso porcentaje={reto.porcentajeColaborativo} />
                    <p className="text-xs text-texto-sec mt-2 tabular-nums">
                        {formatoProgreso(reto.tipo, reto.progresoColaborativo, reto.meta)} · {reto.porcentajeColaborativo || 0}%
                    </p>
                </div>
            )}
        </article>
    )
}

export default function Retos() {
    const { avisar, confirmar, avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const [tab, setTab] = useState('activos')
    const [activos, setActivos] = useState([])
    const [disponibles, setDisponibles] = useState([])
    const [logros, setLogros] = useState([])
    const [seguidos, setSeguidos] = useState([])
    const [loading, setLoading] = useState(true)

    const cargarActivos = useCallback(async () => {
        try { const res = await api.get(`/retos/usuario/${usuario.id}/activos?size=50`); setActivos(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar tus retos.') }
    }, [avisarCarga, usuario])
    const cargarDisponibles = useCallback(async () => {
        try { const res = await api.get('/retos/disponibles?size=50'); setDisponibles(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar los retos disponibles.') }
    }, [avisarCarga])
    const cargarLogros = useCallback(async () => {
        try { const res = await api.get(`/retos/usuario/${usuario.id}/logros?size=50`); setLogros(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar tus retos completados.') }
    }, [avisarCarga, usuario])
    const cargarSeguidos = useCallback(async () => {
        try { const res = await api.get(`/usuarios/${usuario.id}/seguidos`); setSeguidos((res.data || []).map(u => u.idusuario)) }
        catch (err) { console.error('Error:', err) }
    }, [usuario])

    useEffect(() => {
        if (!usuario) return
        Promise.all([cargarActivos(), cargarDisponibles(), cargarLogros(), cargarSeguidos()])
            .finally(() => setLoading(false))
    }, [cargarActivos, cargarDisponibles, cargarLogros, cargarSeguidos, usuario])

    const unirse = async (idreto) => {
        try {
            await api.post(`/retos/${idreto}/unirse?usuarioId=${usuario.id}`)
            await Promise.all([cargarActivos(), cargarDisponibles()])
            setTab('activos')
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    const abandonar = async (idreto) => {
        if (!await confirmar({ titulo: '¿Abandonar este reto?', texto: 'Perderás el progreso que llevas en él.', aceptar: 'Abandonar', peligro: true })) return
        try {
            await api.delete(`/retos/${idreto}/abandonar?usuarioId=${usuario.id}`)
            await Promise.all([cargarActivos(), cargarDisponibles()])
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    // Explorar: oficiales y colaborativos para todos; compartidos solo de amigos
    // Fuera los retos en los que ya estás, tanto en curso como completados
    const idsMios = new Set([...activos.map(a => a.idreto), ...logros.map(l => l.idreto)])
    const explorables = disponibles.filter(r => !idsMios.has(r.idreto))
    const comunidad = explorables.filter(r => r.modalidad === 'PREDEFINIDO' || r.modalidad === 'COLABORATIVO')
    // Los tuyos también, por si creaste alguno antes de que el creador participara automáticamente
    const deAmigos = explorables.filter(r => r.modalidad === 'COMPARTIDO'
        && (seguidos.includes(r.idCreador) || r.idCreador === usuario.id))

    const tabs = [
        { key: 'activos', label: `Activos${activos.length ? ` (${activos.length})` : ''}` },
        { key: 'explorar', label: 'Explorar' },
        { key: 'completados', label: 'Completados' },
    ]

    if (loading) return <p className="text-texto-sec">Cargando…</p>

    const vacio = (texto, accion) => (
        <div className="py-6">
            <p className="font-serif text-xl text-texto-sec">{texto}</p>
            {accion}
        </div>
    )

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-6">
                <h1 className="font-serif text-4xl leading-none text-texto">Retos</h1>
                <Link to="/crear-reto" className="btn-acento">Nuevo reto</Link>
            </div>

            <Pestanas pestanas={tabs} activa={tab} onCambiar={setTab} className="mb-4" />

            {tab === 'activos' && (
                activos.length === 0 ? (
                    vacio('Ningún reto en marcha. Busca uno que te tiente.',
                        <button onClick={() => setTab('explorar')} className="btn-secundario mt-4">Explorar retos</button>)
                ) : (
                    <div>
                        {activos.map((p) => <TarjetaActivo key={p.idparticipante} p={p} onAbandonar={abandonar} />)}
                    </div>
                )
            )}

            {tab === 'explorar' && (
                <>
                    <h2 className="etiqueta mt-8 mb-2">Retos de la comunidad</h2>
                    {comunidad.length === 0 ? (
                        vacio('Ahora mismo no hay retos de la comunidad abiertos.')
                    ) : (
                        <div className="border-t border-linea mb-10">
                            {comunidad.map(r => <TarjetaExplorar key={r.idreto} reto={r} onUnirse={unirse} />)}
                        </div>
                    )}

                    <h2 className="etiqueta mt-8 mb-2">De tus amigos</h2>
                    {deAmigos.length === 0 ? (
                        vacio('Tus amigos no tienen retos abiertos.')
                    ) : (
                        <div className="border-t border-linea">
                            {deAmigos.map(r => <TarjetaExplorar key={r.idreto} reto={r} onUnirse={unirse} />)}
                        </div>
                    )}
                </>
            )}

            {tab === 'completados' && (
                logros.length === 0 ? (
                    vacio('Todavía no has cumplido ningún reto. El primero está más cerca de lo que parece.')
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                        {logros.map((l) => (
                            <article key={l.idreto} className="flex items-center gap-5 py-6 border-b border-linea">
                                {/* Sello de ex libris con la meta cumplida */}
                                <Sello numero={l.meta} etiqueta={UNIDAD[l.tipo] || ''} className="w-20 h-20 flex-shrink-0" />
                                <div className="min-w-0">
                                    <h3 className="font-serif text-lg leading-snug text-texto">{l.tituloReto}</h3>
                                    <p className="text-xs text-texto-sec mt-1">{MODALIDAD[l.modalidad] || l.modalidad}</p>
                                    {l.fechaCumplimiento && (
                                        <p className="text-xs text-texto-ter mt-1">Cumplido el {new Date(l.fechaCumplimiento).toLocaleDateString('es-ES')}</p>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )
            )}
        </div>
    )
}
