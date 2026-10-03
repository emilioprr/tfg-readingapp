import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificaciones } from '../context/NotificacionesContext'
import { X } from '@phosphor-icons/react'

// Texto breve de cada aviso: una etiqueta en versalitas y una frase (sin emojis)
const formatearMensaje = (n) => {
    const quien = n.nombreUsuarioOrigen || 'Alguien'
    switch (n.tipo) {
        case 'NUEVO_SEGUIDOR':
            return { titulo: 'Nuevo seguidor', texto: `${quien} ha empezado a seguirte` }
        case 'NUEVA_RESENA_SEGUIDO':
            return { titulo: 'Nueva reseña', texto: `${quien} ha reseñado ${n.tituloLibro || 'un libro'}` }
        case 'LIKE_RESENA':
            return { titulo: 'Me gusta', texto: `A ${quien} le ha gustado tu reseña` }
        case 'LIKE_CITA':
            return { titulo: 'Me gusta', texto: `A ${quien} le ha gustado tu cita` }
        case 'LIKE_LISTA':
            return { titulo: 'Me gusta', texto: `A ${quien} le ha gustado tu lista ${n.nombreLista || ''}`.trim() }
        case 'NUEVA_RECOMENDACION':
            return { titulo: 'Recomendación', texto: `${quien} te recomienda ${n.tituloLibro || 'un libro'}` }
        case 'RETO_CUMPLIDO':
            return { titulo: 'Reto cumplido', texto: 'Reto cumplido. Buen trabajo.', detalle: n.mensaje }
        default:
            return { titulo: 'Aviso', texto: n.mensaje }
    }
}

const getDestino = (n) => {
    switch (n.tipo) {
        case 'NUEVO_SEGUIDOR': return `/usuario/${n.idusuarioOrigen}`
        case 'NUEVA_RESENA_SEGUIDO': return n.idresena ? `/resena/${n.idresena}` : null
        case 'LIKE_RESENA': return n.idresena ? `/resena/${n.idresena}` : null
        case 'LIKE_CITA': return '/perfil?tab=anotaciones'
        case 'LIKE_LISTA': return n.idlista ? `/lista/${n.idlista}` : null
        case 'NUEVA_RECOMENDACION': return n.idlibro ? `/libro/${n.idlibro}` : null
        case 'RETO_CUMPLIDO': return '/retos'
        default: return '/notificaciones'
    }
}

export default function ToastNotificaciones() {
    const { usuario } = useAuth()
    const { noLeidas, cargadas } = useNotificaciones()
    const navigate = useNavigate()
    const [toasts, setToasts] = useState([])
    const ultimaComprobacion = useRef(null)

    // Cada vez que llega la lista de no leídas, se avisa de las que no se habían visto aún
    useEffect(() => {
        if (!usuario || !cargadas) {
            ultimaComprobacion.current = null
            return
        }
        const ids = noLeidas.map(n => n.idnotificacion)
        if (ultimaComprobacion.current === null) {
            // Primera carga: lo que ya estaba sin leer no se anuncia
            ultimaComprobacion.current = ids
            return
        }
        const sinVer = noLeidas.filter(n =>
            !ultimaComprobacion.current.includes(n.idnotificacion) &&
            ['NUEVO_SEGUIDOR', 'NUEVA_RECOMENDACION', 'LIKE_RESENA', 'LIKE_CITA', 'LIKE_LISTA', 'RETO_CUMPLIDO'].includes(n.tipo))
        ultimaComprobacion.current = ids

        sinVer.forEach(n => {
            setToasts(prev => [...prev, { id: n.idnotificacion, tipo: n.tipo, mensaje: formatearMensaje(n), destino: getDestino(n) }])
            // Auto-eliminar después de 5 segundos
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== n.idnotificacion)), 5000)
        })
    }, [noLeidas, cargadas, usuario])

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
        <div className="fixed top-16 right-4 sm:right-6 z-50 flex flex-col gap-3 w-[calc(100%-2rem)] max-w-sm" aria-live="polite">
            {toasts.map((toast) => (
                <div key={toast.id} role="status" tabIndex={0}
                     onClick={() => handleClick(toast)} onKeyDown={(e) => { if (e.key === 'Enter') handleClick(toast) }}
                     className="animate-tira bg-superficie border border-linea border-t-2 border-t-acento rounded px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-superficie-alta">
                    <div className="flex-1 min-w-0">
                        <p className="etiqueta">{toast.mensaje.titulo}</p>
                        <p className="font-serif text-[17px] leading-snug text-texto mt-1">{toast.mensaje.texto}</p>
                        {toast.mensaje.detalle && <p className="text-texto-sec text-xs mt-1 truncate">{toast.mensaje.detalle}</p>}
                    </div>
                    <button onClick={(e) => cerrarToast(e, toast.id)} aria-label="Cerrar aviso"
                            className="text-texto-ter hover:text-texto flex-shrink-0 mt-0.5">
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    )
}
