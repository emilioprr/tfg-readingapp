import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Notificaciones() {
    const { usuario } = useAuth()
    const [notificaciones, setNotificaciones] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarNotificaciones()
    }, [])

    const cargarNotificaciones = async () => {
        try {
            const res = await api.get(`/notificaciones/usuario/${usuario.id}?size=20`)
            setNotificaciones(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando notificaciones:', err)
        } finally {
            setLoading(false)
        }
    }

    const marcarLeida = async (id) => {
        try {
            await api.put(`/notificaciones/${id}/leida`)
            setNotificaciones(prev =>
                prev.map(n => n.idnotificacion === id ? { ...n, leida: true } : n)
            )
        } catch (err) {
            console.error('Error marcando como leída:', err)
        }
    }

    const marcarTodasLeidas = async () => {
        try {
            await api.put(`/notificaciones/usuario/${usuario.id}/leer-todas`)
            setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
        } catch (err) {
            console.error('Error marcando todas como leídas:', err)
        }
    }

    if (loading) return <p className="text-gray-400">Cargando...</p>

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-amber-400">Notificaciones</h1>
                {notificaciones.some(n => !n.leida) && (
                    <button onClick={marcarTodasLeidas}
                            className="text-sm text-amber-400 hover:underline">
                        Marcar todas como leídas
                    </button>
                )}
            </div>

            {notificaciones.length === 0 ? (
                <p className="text-gray-500">No tienes notificaciones</p>
            ) : (
                <div className="space-y-2">
                    {notificaciones.map((n) => (
                        <div key={n.idnotificacion}
                             onClick={() => !n.leida && marcarLeida(n.idnotificacion)}
                             className={`p-4 rounded-lg border cursor-pointer ${
                                 n.leida
                                     ? 'bg-gray-900 border-gray-800 text-gray-400'
                                     : 'bg-gray-900 border-amber-500/30 text-gray-200'
                             }`}>
                            <div className="flex items-center justify-between">
                                <p>{n.mensaje}</p>
                                {!n.leida && <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{new Date(n.fecha).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}