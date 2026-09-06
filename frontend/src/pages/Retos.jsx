import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Retos() {
    const { usuario } = useAuth()
    const [disponibles, setDisponibles] = useState([])
    const [activos, setActivos] = useState([])
    const [logros, setLogros] = useState([])
    const [tab, setTab] = useState('disponibles')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarDisponibles()
        if (usuario) { cargarActivos(); cargarLogros() }
    }, [usuario])

    const cargarDisponibles = async () => {
        try { const res = await api.get('/retos/disponibles?size=20'); setDisponibles(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) } finally { setLoading(false) }
    }
    const cargarActivos = async () => {
        try { const res = await api.get(`/retos/usuario/${usuario.id}/activos?size=20`); setActivos(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }
    const cargarLogros = async () => {
        try { const res = await api.get(`/retos/usuario/${usuario.id}/logros?size=20`); setLogros(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }
    const unirse = async (idreto) => {
        try { await api.post(`/retos/${idreto}/unirse?usuarioId=${usuario.id}`); cargarDisponibles(); cargarActivos() }
        catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    const tabs = [{ key: 'disponibles', label: 'Disponibles' }, { key: 'activos', label: 'Mis retos' }, { key: 'logros', label: 'Logros' }]
    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-dark-text tracking-tight">Retos</h1>
                <Link to="/crear-reto" className="text-sm bg-terra hover:bg-terra-hover text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">+ Nuevo reto</Link>
            </div>
            <div className="flex gap-6 mb-6 border-b border-dark-border">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                            className={`pb-3 text-sm font-medium transition-colors ${tab === t.key ? 'text-terra border-b-2 border-terra' : 'text-dark-muted hover:text-dark-text'}`}>{t.label}</button>
                ))}
            </div>

            {tab === 'disponibles' && (
                <div className="space-y-4">
                    {disponibles.length === 0 ? <p className="text-dark-muted">No hay retos disponibles</p> :
                        disponibles.map((reto) => (
                            <div key={reto.idreto} className="bg-dark-card p-5 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-dark-text font-medium">{reto.titulo}</h3>
                                        {reto.descripcion && <p className="text-dark-muted text-sm mt-1">{reto.descripcion}</p>}
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-terra/10 text-terra px-2 py-1 rounded-full">{reto.tipo}</span>
                                            <span className="text-xs bg-dark-elevated text-dark-muted px-2 py-1 rounded-full">{reto.modalidad}</span>
                                            <span className="text-xs text-dark-muted">Meta: {reto.meta}</span>
                                        </div>
                                    </div>
                                    {usuario && <button onClick={() => unirse(reto.idreto)} className="bg-terra hover:bg-terra-hover text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Unirse</button>}
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {tab === 'activos' && (
                <div className="space-y-4">
                    {activos.length === 0 ? <p className="text-dark-muted">No tienes retos activos</p> :
                        activos.map((p) => (
                            <div key={p.idparticipante} className="bg-dark-card p-5 rounded-xl">
                                <h3 className="text-dark-text font-medium">{p.tituloReto}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs bg-terra/10 text-terra px-2 py-1 rounded-full">{p.tipoReto}</span>
                                    <span className="text-xs bg-dark-elevated text-dark-muted px-2 py-1 rounded-full">{p.modalidadReto}</span>
                                </div>
                                <div className="mt-3">
                                    <div className="bg-dark-border rounded-full h-2">
                                        <div className="bg-terra h-2 rounded-full transition-all" style={{ width: `${Math.min(100, p.porcentaje)}%` }} />
                                    </div>
                                    <p className="text-sm text-dark-muted mt-1">
                                        {p.progreso}/{p.meta}{p.tipoReto === 'HORAS' ? ' min' : ''} · {p.porcentaje}%
                                    </p>
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {tab === 'logros' && (
                <div className="space-y-4">
                    {logros.length === 0 ? <p className="text-dark-muted">Aún no has completado ningún reto</p> :
                        logros.map((l) => (
                            <div key={l.idreto} className="bg-dark-card p-5 rounded-xl border-l-2 border-terra">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🏆</span>
                                    <div>
                                        <h3 className="text-dark-text font-medium">{l.tituloReto}</h3>
                                        <div className="flex gap-2 text-xs text-dark-muted mt-1">
                                            <span>{l.tipo}</span>
                                            <span>Meta: {l.meta}</span>
                                            {l.fechaCumplimiento && <span>Completado el {new Date(l.fechaCumplimiento).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    )
}