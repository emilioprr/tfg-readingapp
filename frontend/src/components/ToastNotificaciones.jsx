import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function ToastNotificaciones() {
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [toasts, setToasts] = useState([])
    const ultimaComprobacion = useRef(null)

    useEffect(() => {
        if (!usuario) return

        // Comprobar cada 15 segundos
        const interval = setInterval(comprobarNotificaciones, 15000)
        comprobarNotificaciones()

        return () => clearInterval(interval)
    }, [usuario])

    const comprobarNotificaciones = async () => {
        try {
            const res = await api.get(`/notificaciones/usuario/${usuario.id}?size=5`)
            const notis = res.data.content || res.data || []
            const nuevas = notis.filter(n => !n.leida)

            if (ultimaComprobacion.current === null) {
                // Primera comprobación, no mostrar toasts
                ultimaComprobacion.current = nuevas.map(n => n.idnotificacion)
                return
            }

            const sinVer = nuevas.filter(n =>
            !ultimaComprobacion.current.includes(n.idnotificacion) &&
            ['NUEVO_SEGUIDOR', 'NUEVA_RECOMENDACION', 'LIKE_RESENA'].includes(n.tipo)
            )

            if (sinVer.length > 0) {
                sinVer.forEach(n => {
                    const toast = {
                        id: n.idnotificacion,
                        tipo: n.tipo,
                        mensaje: formatearMensaje(n),
                        destino: getDestino(n),
                    }
                    setToasts(prev => [...prev, toast])

                    // Auto-eliminar después de 5 segundos
                    setTimeout(() => {
                        setToasts(prev => prev.filter(t => t.id !== n.idnotificacion))
                    }, 5000)
                })
            }

            ultimaComprobacion.current = nuevas.map(n => n.idnotificacion)
        } catch (err) { /* silencioso */ }
    }

    const formatearMensaje = (n) => {
        switch (n.tipo) {
            case 'NUEVO_SEGUIDOR':
                return { icono: '👤', titulo: 'Nuevo seguidor', texto: `${n.nombreUsuarioOrigen} ha empezado a seguirte` }
            case 'NUEVA_RESENA_SEGUIDO':
                return { icono: '⭐', titulo: 'Nueva reseña', texto: `${n.nombreUsuarioOrigen} ha reseñado ${n.tituloLibro || 'un libro'}` }
            case 'LIKE_RESENA':
                return { icono: '❤️', titulo: 'Nuevo like', texto: `A ${n.nombreUsuarioOrigen} le gustó tu reseña` }
            case 'NUEVA_RECOMENDACION':
                return { icono: '📚', titulo: 'Recomendación', texto: `${n.nombreUsuarioOrigen} te recomienda ${n.tituloLibro || 'un libro'}` }
            case 'RETO_CUMPLIDO':
                return { icono: '🎉', titulo: '¡Reto completado!', texto: n.mensaje }
            default:
                return { icono: '🔔', titulo: 'Notificación', texto: n.mensaje }
        }
    }

    const getDestino = (n) => {
        switch (n.tipo) {
            case 'NUEVO_SEGUIDOR': return `/usuario/${n.idusuarioOrigen}`
            case 'NUEVA_RESENA_SEGUIDO': return n.idresena ? `/resena/${n.idresena}` : null
            case 'LIKE_RESENA': return n.idresena ? `/resena/${n.idresena}` : null
            case 'NUEVA_RECOMENDACION': return n.idlibro ? `/libro/${n.idlibro}` : null
            case 'RETO_CUMPLIDO': return '/retos'
            default: return '/notificaciones'
        }
    }

    const handleClick = (toast) => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
        if (toast.destino) navigate(toast.destino)
    }

    const cerrarToast = (e, id) => {
        e.stopPropagation()
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    if (toasts.length === 0) return null

    return (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
            {toasts.map((toast) => (
                <div key={toast.id}
                     onClick={() => handleClick(toast)}
                     className="animate-slide-in bg-dark-card border border-terra/40 rounded-xl p-4 shadow-2xl flex items-center gap-3 max-w-sm cursor-pointer hover:bg-dark-elevated transition-colors">
                    <div className="text-2xl flex-shrink-0">{toast.mensaje.icono}</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-dark-text font-semibold text-sm">{toast.mensaje.titulo}</p>
                        <p className="text-dark-muted text-xs truncate">{toast.mensaje.texto}</p>
                    </div>
                    <button onClick={(e) => cerrarToast(e, toast.id)}
                            className="text-dark-muted hover:text-dark-text text-sm flex-shrink-0">✕</button>
                </div>
            ))}
        </div>
    )
}