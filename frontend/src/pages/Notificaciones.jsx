import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificaciones } from '../context/NotificacionesContext'
import api from '../api/axios'

export default function Notificaciones() {
    const { usuario } = useAuth()
    const { refrescar } = useNotificaciones()
    const navigate = useNavigate()
    const [notificaciones, setNotificaciones] = useState([])
    const [loading, setLoading] = useState(true)

    const cargarNotificaciones = useCallback(async () => {
        try { const res = await api.get(`/notificaciones/usuario/${usuario.id}?size=20`); setNotificaciones(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) } finally { setLoading(false) }
    }, [usuario])

    useEffect(() => { cargarNotificaciones() }, [cargarNotificaciones])

    const marcarLeida = async (id) => {
        try { await api.put(`/notificaciones/${id}/leida`); setNotificaciones(prev => prev.map(n => n.idnotificacion === id ? { ...n, leida: true } : n)); refrescar() }
        catch (err) { console.error('Error:', err) }
    }

    const marcarTodasLeidas = async () => {
        try { await api.put(`/notificaciones/usuario/${usuario.id}/leer-todas`); setNotificaciones(prev => prev.map(n => ({ ...n, leida: true }))); refrescar() }
        catch (err) { console.error('Error:', err) }
    }

    const handleClick = (n) => {
        if (!n.leida) marcarLeida(n.idnotificacion)

        switch (n.tipo) {
            case 'NUEVO_SEGUIDOR':
                if (n.idusuarioOrigen) navigate(`/usuario/${n.idusuarioOrigen}`)
                break
            case 'NUEVA_RESENA_SEGUIDO':
                if (n.idresena) navigate(`/resena/${n.idresena}`)
                else if (n.idlibro) navigate(`/libro/${n.idlibro}`)
                break
            case 'LIKE_RESENA':
                if (n.idresena) navigate(`/resena/${n.idresena}`)
                break
            case 'NUEVA_RECOMENDACION':
                if (n.idlibro) navigate(`/libro/${n.idlibro}`)
                break
            case 'LIKE_CITA':
                navigate('/perfil?tab=anotaciones')
                break
            case 'RETO_CUMPLIDO':
                navigate('/retos')
                break
            case 'NUEVO_LIBRO_AUTOR':
                if (n.idlibro) navigate(`/libro/${n.idlibro}`)
                break
            default:
                if (n.idlibro) navigate(`/libro/${n.idlibro}`)
                else if (n.idusuarioOrigen) navigate(`/usuario/${n.idusuarioOrigen}`)
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
                                    {n.tipo === 'NUEVO_SEGUIDOR' && n.nombreUsuarioOrigen ? (
                                        <><span className="text-terra font-medium">{n.nombreUsuarioOrigen}</span> ha empezado a seguirte</>
                                    ) : n.tipo === 'NUEVA_RESENA_SEGUIDO' && n.nombreUsuarioOrigen && n.tituloLibro ? (
                                        <><span className="text-terra font-medium">{n.nombreUsuarioOrigen}</span> ha reseñado <span className="text-terra font-medium">{n.tituloLibro}</span></>
                                    ) : n.tipo === 'NUEVA_RECOMENDACION' && n.nombreUsuarioOrigen && n.tituloLibro ? (
                                        <><span className="text-terra font-medium">{n.nombreUsuarioOrigen}</span> te ha recomendado <span className="text-terra font-medium">{n.tituloLibro}</span></>
                                    ) : n.tipo === 'LIKE_RESENA' && n.nombreUsuarioOrigen ? (
                                        <><span className="text-terra font-medium">{n.nombreUsuarioOrigen}</span> le ha gustado tu reseña</>
                                    ) : n.tipo === 'LIKE_CITA' && n.nombreUsuarioOrigen ? (
                                        <>A <span className="text-terra font-medium">{n.nombreUsuarioOrigen}</span> le ha gustado tu cita{n.tituloLibro && <> de <span className="text-terra font-medium">{n.tituloLibro}</span></>}</>
                                    ) : n.tipo === 'NUEVO_LIBRO_AUTOR' && n.tituloLibro ? (
                                        <>Nuevo libro: <span className="text-terra font-medium">{n.tituloLibro}</span></>
                                    ) : (
                                        n.mensaje
                                    )}
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