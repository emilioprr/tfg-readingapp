import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const MODALIDAD = { PERSONAL: 'Personal', COMPARTIDO: 'Con amigos', PREDEFINIDO: 'Oficial', COLABORATIVO: 'Colaborativo' }
const TIPO = { LIBROS: 'Libros', PAGINAS: 'Páginas', HORAS: 'Horas' }

const formatoProgreso = (tipo, progreso = 0, meta = 0) =>
    tipo === 'HORAS' ? `${(progreso / 60).toFixed(1)} / ${meta} h` : `${progreso} / ${meta}`

function BarraProgreso({ porcentaje = 0 }) {
    return (
        <div className="bg-dark-border rounded-full h-2">
            <div className="bg-terra h-2 rounded-full transition-all" style={{ width: `${Math.min(100, porcentaje)}%` }} />
        </div>
    )
}

function Etiquetas({ tipo, modalidad }) {
    return (
        <div className="flex gap-2 mt-2">
            <span className="text-xs bg-terra/10 text-terra px-2 py-0.5 rounded-full">{TIPO[tipo] || tipo}</span>
            <span className="text-xs bg-dark-elevated text-dark-muted px-2 py-0.5 rounded-full">{MODALIDAD[modalidad] || modalidad}</span>
        </div>
    )
}

function ParticipantesReto({ idreto, tipo }) {
    const [participantes, setParticipantes] = useState(null)

    useEffect(() => {
        api.get(`/retos/${idreto}`)
            .then(res => setParticipantes([...(res.data.participantes || [])].sort((a, b) => (b.porcentaje || 0) - (a.porcentaje || 0))))
            .catch(() => setParticipantes([]))
    }, [idreto])

    if (participantes === null) return <p className="text-dark-muted text-xs mt-3">Cargando participantes...</p>
    if (participantes.length === 0) return <p className="text-dark-muted text-xs mt-3">Sin participantes</p>

    return (
        <div className="mt-4 space-y-2 border-t border-dark-border pt-3">
            {participantes.map((p, i) => (
                <div key={p.idparticipante} className="flex items-center gap-3">
                    <span className="text-dark-muted text-xs w-4">{i + 1}</span>
                    <Link to={`/usuario/${p.idusuario}`} className="text-dark-text text-sm hover:text-terra transition-colors w-28 truncate">
                        {p.nombreUsuario}
                    </Link>
                    <div className="flex-1"><BarraProgreso porcentaje={p.porcentaje} /></div>
                    <span className="text-dark-muted text-xs w-20 text-right">
                        {p.retoCumplido ? '✓ Completado' : `${p.porcentaje || 0}%`}
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
        <div className="bg-dark-card p-5 rounded-xl">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-dark-text font-medium">{p.tituloReto}</h3>
                    <Etiquetas tipo={p.tipoReto} modalidad={p.modalidadReto} />
                </div>
                <button onClick={() => onAbandonar(p.idreto)}
                        className="text-red-400/60 hover:text-red-400 text-xs transition-colors">
                    Abandonar
                </button>
            </div>
            <div className="mt-4">
                <BarraProgreso porcentaje={p.porcentaje} />
                <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-dark-muted">{formatoProgreso(p.tipoReto, p.progreso, p.meta)} · {p.porcentaje || 0}%</p>
                    {esGrupal && (
                        <button onClick={() => setVerParticipantes(v => !v)}
                                className="text-xs text-dark-muted hover:text-terra transition-colors">
                            {verParticipantes ? 'Ocultar participantes' : 'Ver participantes'}
                        </button>
                    )}
                </div>
            </div>
            {verParticipantes && <ParticipantesReto idreto={p.idreto} tipo={p.tipoReto} />}
        </div>
    )
}

function TarjetaExplorar({ reto, onUnirse }) {
    return (
        <div className="bg-dark-card p-5 rounded-xl">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="text-dark-text font-medium">{reto.titulo}</h3>
                    {reto.descripcion && <p className="text-dark-muted text-sm mt-1">{reto.descripcion}</p>}
                    <Etiquetas tipo={reto.tipo} modalidad={reto.modalidad} />
                    <div className="flex gap-3 text-xs text-dark-muted mt-2">
                        <span>Meta: {reto.meta}{reto.tipo === 'HORAS' ? ' h' : ''}</span>
                        {reto.fechaFin && <span>Hasta el {new Date(reto.fechaFin).toLocaleDateString()}</span>}
                        <span>{reto.numParticipantes || 0} participantes</span>
                        {reto.modalidad === 'COMPARTIDO' && reto.nombreCreador && <span>Creado por {reto.nombreCreador}</span>}
                    </div>
                </div>
                <button onClick={() => onUnirse(reto.idreto)}
                        className="bg-terra hover:bg-terra-hover text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex-shrink-0">
                    Unirse
                </button>
            </div>
            {reto.modalidad === 'COLABORATIVO' && (
                <div className="mt-4">
                    <p className="text-xs text-dark-muted mb-1">Progreso de la comunidad</p>
                    <BarraProgreso porcentaje={reto.porcentajeColaborativo} />
                    <p className="text-xs text-dark-muted mt-1">
                        {formatoProgreso(reto.tipo, reto.progresoColaborativo, reto.meta)} · {reto.porcentajeColaborativo || 0}%
                    </p>
                </div>
            )}
        </div>
    )
}

export default function Retos() {
    const { usuario } = useAuth()
    const [tab, setTab] = useState('activos')
    const [activos, setActivos] = useState([])
    const [disponibles, setDisponibles] = useState([])
    const [logros, setLogros] = useState([])
    const [seguidos, setSeguidos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!usuario) return
        Promise.all([cargarActivos(), cargarDisponibles(), cargarLogros(), cargarSeguidos()])
            .finally(() => setLoading(false))
    }, [usuario])

    const cargarActivos = async () => {
        try { const res = await api.get(`/retos/usuario/${usuario.id}/activos?size=50`); setActivos(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }
    const cargarDisponibles = async () => {
        try { const res = await api.get('/retos/disponibles?size=50'); setDisponibles(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }
    const cargarLogros = async () => {
        try { const res = await api.get(`/retos/usuario/${usuario.id}/logros?size=50`); setLogros(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }
    const cargarSeguidos = async () => {
        try { const res = await api.get(`/usuarios/${usuario.id}/seguidos`); setSeguidos((res.data || []).map(u => u.idusuario)) }
        catch (err) { console.error('Error:', err) }
    }

    const unirse = async (idreto) => {
        try {
            await api.post(`/retos/${idreto}/unirse?usuarioId=${usuario.id}`)
            await Promise.all([cargarActivos(), cargarDisponibles()])
            setTab('activos')
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    const abandonar = async (idreto) => {
        if (!window.confirm('¿Abandonar este reto? Perderás tu progreso.')) return
        try {
            await api.delete(`/retos/${idreto}/abandonar?usuarioId=${usuario.id}`)
            await Promise.all([cargarActivos(), cargarDisponibles()])
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    // Explorar: oficiales y colaborativos para todos; compartidos solo de amigos
    const idsActivos = new Set(activos.map(a => a.idreto))
    const explorables = disponibles.filter(r => !idsActivos.has(r.idreto))
    const comunidad = explorables.filter(r => r.modalidad === 'PREDEFINIDO' || r.modalidad === 'COLABORATIVO')
    const deAmigos = explorables.filter(r => r.modalidad === 'COMPARTIDO' && seguidos.includes(r.idCreador))

    const tabs = [
        { key: 'activos', label: `Activos${activos.length ? ` (${activos.length})` : ''}` },
        { key: 'explorar', label: 'Explorar' },
        { key: 'completados', label: 'Completados' },
    ]

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-dark-text tracking-tight">Retos</h1>
                <Link to="/crear-reto" className="text-sm bg-terra hover:bg-terra-hover text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    + Nuevo reto
                </Link>
            </div>

            <div className="flex gap-2 mb-8 border-b border-dark-border">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                                tab === t.key ? 'text-terra' : 'text-dark-muted hover:text-dark-text'
                            }`}>
                        {t.label}
                        {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terra rounded-full" />}
                    </button>
                ))}
            </div>

            {tab === 'activos' && (
                activos.length === 0 ? (
                    <div className="text-center py-16 bg-dark-card rounded-2xl">
                        <p className="text-dark-muted mb-2">No tienes retos activos</p>
                        <button onClick={() => setTab('explorar')} className="text-terra hover:text-terra-hover text-sm transition-colors">
                            Explorar retos
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activos.map((p) => <TarjetaActivo key={p.idparticipante} p={p} onAbandonar={abandonar} />)}
                    </div>
                )
            )}

            {tab === 'explorar' && (
                <>
                    <h2 className="text-lg font-semibold text-dark-text mb-4">Retos de la comunidad</h2>
                    {comunidad.length === 0 ? (
                        <p className="text-dark-muted text-sm mb-10">No hay retos de la comunidad ahora mismo</p>
                    ) : (
                        <div className="space-y-4 mb-10">
                            {comunidad.map(r => <TarjetaExplorar key={r.idreto} reto={r} onUnirse={unirse} />)}
                        </div>
                    )}

                    <h2 className="text-lg font-semibold text-dark-text mb-4">De tus amigos</h2>
                    {deAmigos.length === 0 ? (
                        <p className="text-dark-muted text-sm">Tus amigos no tienen retos compartidos</p>
                    ) : (
                        <div className="space-y-4">
                            {deAmigos.map(r => <TarjetaExplorar key={r.idreto} reto={r} onUnirse={unirse} />)}
                        </div>
                    )}
                </>
            )}

            {tab === 'completados' && (
                logros.length === 0 ? (
                    <div className="text-center py-16 bg-dark-card rounded-2xl">
                        <p className="text-dark-muted">Aún no has completado ningún reto</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {logros.map((l) => (
                            <div key={l.idreto} className="bg-dark-card p-5 rounded-xl border-l-2 border-terra flex items-center gap-4">
                                <span className="text-2xl">🏆</span>
                                <div>
                                    <h3 className="text-dark-text font-medium">{l.tituloReto}</h3>
                                    <div className="flex gap-3 text-xs text-dark-muted mt-1">
                                        <span>{TIPO[l.tipo] || l.tipo}</span>
                                        <span>{MODALIDAD[l.modalidad] || l.modalidad}</span>
                                        <span>Meta: {l.meta}{l.tipo === 'HORAS' ? ' h' : ''}</span>
                                        {l.fechaCumplimiento && <span>Completado el {new Date(l.fechaCumplimiento).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    )
}