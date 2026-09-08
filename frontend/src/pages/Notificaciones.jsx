import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Notificaciones() {
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [notificaciones, setNotificaciones] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { cargarNotificaciones() }, [])

    const cargarNotificaciones = async () => {
        try { const res = await api.get(`/notificaciones/usuario/${usuario.id}?size=20`); setNotificaciones(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) } finally { setLoading(false) }
    }

    const marcarLeida = async (id) => {
        try { await api.put(`/notificaciones/${id}/leida`); setNotificaciones(prev => prev.map(n => n.idnotificacion === id ? { ...n, leida: true } : n)) }
        catch (err) { console.error('Error:', err) }
    }

    const marcarTodasLeidas = async () => {
        try { await api.put(`/notificaciones/usuario/${usuario.id}/leer-todas`); setNotificaciones(prev => prev.map(n => ({ ...n, leida: true }))) }
        catch (err) { console.error('Error:', err) }
    }

    const handleClick = (n) => {
        if (!n.leida) marcarLeida(n.idnotificacion)

        if (n.tipo === 'NUEVO_SEGUIDOR' && n.idusuarioOrigen) {
            navigate(`/usuario/${n.idusuarioOrigen}`)
        } else if (n.tipo === 'NUEVA_RESENA' && n.idresena) {
            navigate(`/resena/${n.idresena}`)
        } else if (n.tipo === 'RECOMENDACION' && n.idlibro) {
            navigate(`/libro/${n.idlibro}`)
        } else if (n.tipo === 'LIKE_RESENA' && n.idresena) {
            navigate(`/resena/${n.idresena}`)
        } else if (n.tipo === 'RETO_COMPLETADO' && n.idreto) {
            navigate(`/retos`)
        } else if (n.idlibro) {
            navigate(`/libro/${n.idlibro}`)
        } else if (n.idusuarioOrigen) {
            navigate(`/usuario/${n.idusuarioOrigen}`)
        }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-dark-text tracking-tight">Notificaciones</h1>
                {notificaciones.some(n => !n.leida) && (
                    <button onClick={marcarTodasLeidas} className="text-sm text-terra hover:text-terra-hover transition-colors">Marcar todas como leídas</button>
                )}
            </div>
            {notificaciones.length === 0 ? <p className="text-dark-muted">No tienes notificaciones</p> : (
                <div className="space-y-2">
                    {notificaciones.map((n) => (
                        <div key={n.idnotificacion} onClick={() => handleClick(n)}
                             className={`p-4 rounded-xl cursor-pointer transition-colors ${n.leida ? 'bg-dark-card text-dark-muted hover:bg-dark-elevated' : 'bg-dark-elevated text-dark-text border-l-2 border-terra hover:bg-dark-border'}`}>
                            <div className="flex items-center justify-between">
                                <p>
                                    {n.nombreUsuarioOrigen && (
                                        <span className="text-terra font-medium">{n.nombreUsuarioOrigen}</span>
                                    )}
                                    {' '}
                                    {n.tipo === 'NUEVO_SEGUIDOR' && 'ha empezado a seguirte'}
                                    {n.tipo === 'NUEVA_RESENA' && <>ha reseñado <span className="text-terra font-medium">{n.tituloLibro}</span></>}
                                    {n.tipo === 'RECOMENDACION' && <>te ha recomendado <span className="text-terra font-medium">{n.tituloLibro}</span></>}
                                    {n.tipo === 'LIKE_RESENA' && 'le ha gustado tu reseña'}
                                    {n.tipo === 'RETO_COMPLETADO' && n.mensaje}
                                    {!['NUEVO_SEGUIDOR', 'NUEVA_RESENA', 'RECOMENDACION', 'LIKE_RESENA', 'RETO_COMPLETADO'].includes(n.tipo) && n.mensaje}
                                </p>
                                {!n.leida && <span className="w-2 h-2 bg-terra rounded-full flex-shrink-0 ml-2" />}
                            </div>
                            <p className="text-xs text-dark-muted mt-1">{new Date(n.fecha).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}