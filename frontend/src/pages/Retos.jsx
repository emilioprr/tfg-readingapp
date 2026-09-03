import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Link } from 'react-router-dom'

export default function Retos() {
    const { usuario } = useAuth()
    const [disponibles, setDisponibles] = useState([])
    const [activos, setActivos] = useState([])
    const [logros, setLogros] = useState([])
    const [tab, setTab] = useState('disponibles')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarDisponibles()
        if (usuario) {
            cargarActivos()
            cargarLogros()
        }
    }, [usuario])

    const cargarDisponibles = async () => {
        try {
            const res = await api.get('/retos/disponibles?size=20')
            setDisponibles(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando retos:', err)
        } finally {
            setLoading(false)
        }
    }

    const cargarActivos = async () => {
        try {
            const res = await api.get(`/retos/usuario/${usuario.id}/activos?size=20`)
            setActivos(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando activos:', err)
        }
    }

    const cargarLogros = async () => {
        try {
            const res = await api.get(`/retos/usuario/${usuario.id}/logros?size=20`)
            setLogros(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando logros:', err)
        }
    }

    const unirse = async (idreto) => {
        try {
            await api.post(`/retos/${idreto}/unirse?usuarioId=${usuario.id}`)
            alert('Te has unido al reto')
            cargarDisponibles()
            cargarActivos()
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error al unirse')
        }
    }

    const tabs = [
        { key: 'disponibles', label: 'Disponibles' },
        { key: 'activos', label: 'Mis retos' },
        { key: 'logros', label: 'Logros' },
    ]

    if (loading) return <p className="text-gray-400">Cargando...</p>

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-amber-400">Retos</h1>
                <Link to="/crear-reto" className="text-sm bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-3 py-1 rounded">
                    + Nuevo reto
                </Link>
            </div>

            <div className="flex gap-4 mb-6 border-b border-gray-800">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                            className={`pb-2 text-sm font-medium ${
                                tab === t.key
                                    ? 'text-amber-400 border-b-2 border-amber-400'
                                    : 'text-gray-400 hover:text-gray-300'
                            }`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'disponibles' && (
                <div className="space-y-4">
                    {disponibles.length === 0 ? (
                        <p className="text-gray-500">No hay retos disponibles</p>
                    ) : (
                        disponibles.map((reto) => (
                            <div key={reto.idreto} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-amber-400 font-medium">{reto.titulo}</h3>
                                        {reto.descripcion && <p className="text-gray-400 text-sm mt-1">{reto.descripcion}</p>}
                                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                            <span className="bg-gray-800 px-2 py-1 rounded">{reto.tipo}</span>
                                            <span className="bg-gray-800 px-2 py-1 rounded">{reto.modalidad}</span>
                                            <span>Meta: {reto.meta}</span>
                                            <span>{reto.numParticipantes} participantes</span>
                                            <span>{reto.fechaInicio} → {reto.fechaFin}</span>
                                        </div>
                                        {reto.modalidad === 'COLABORATIVO' && reto.progresoColaborativo != null && (
                                            <div className="mt-2">
                                                <div className="bg-gray-800 rounded-full h-2 w-48">
                                                    <div className="bg-amber-500 h-2 rounded-full"
                                                         style={{ width: `${Math.min(100, reto.porcentajeColaborativo)}%` }} />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{reto.progresoColaborativo}/{reto.meta} ({reto.porcentajeColaborativo}%)</p>
                                            </div>
                                        )}
                                    </div>
                                    {usuario && (
                                        <button onClick={() => unirse(reto.idreto)}
                                                className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-4 py-2 rounded text-sm">
                                            Unirse
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tab === 'activos' && (
                <div className="space-y-4">
                    {activos.length === 0 ? (
                        <p className="text-gray-500">No tienes retos activos</p>
                    ) : (
                        activos.map((p) => (
                            <div key={p.idparticipante} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                                <h3 className="text-amber-400 font-medium">{p.tituloReto}</h3>
                                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                    <span className="bg-gray-800 px-2 py-1 rounded">{p.tipoReto}</span>
                                    <span className="bg-gray-800 px-2 py-1 rounded">{p.modalidadReto}</span>
                                    <span>Meta: {p.meta}</span>
                                </div>
                                <div className="mt-3">
                                    <div className="bg-gray-800 rounded-full h-3">
                                        <div className="bg-amber-500 h-3 rounded-full"
                                             style={{ width: `${Math.min(100, p.porcentaje)}%` }} />
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">Progreso: {p.progreso}/{p.meta} · {p.porcentaje}%</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Unido el {new Date(p.fechaUnion).toLocaleDateString()}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tab === 'logros' && (
                <div className="space-y-4">
                    {logros.length === 0 ? (
                        <p className="text-gray-500">Aún no has completado ningún reto</p>
                    ) : (
                        logros.map((logro) => (
                            <div key={logro.idreto} className="bg-gray-900 p-4 rounded-lg border border-amber-500/30">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🏆</span>
                                    <div>
                                        <h3 className="text-amber-400 font-medium">{logro.tituloReto}</h3>
                                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                            <span>{logro.tipo}</span>
                                            <span>Meta: {logro.meta}</span>
                                            {logro.fechaCumplimiento && (
                                                <span>Completado el {new Date(logro.fechaCumplimiento).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}