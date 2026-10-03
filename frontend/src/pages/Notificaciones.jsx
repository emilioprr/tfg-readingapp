import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificaciones } from '../context/NotificacionesContext'
import api from '../api/axios'
import { X } from '@phosphor-icons/react'
import { useAvisos } from '../context/AvisosContext'
import { fechaHoraCorta } from '../utils/fechas'

const TAMANIO = 20

export default function Notificaciones() {
    const { avisar, avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const { refrescar } = useNotificaciones()
    const navigate = useNavigate()
    const [notificaciones, setNotificaciones] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagina, setPagina] = useState(0)
    const [hayMas, setHayMas] = useState(false)

    const cargarNotificaciones = useCallback(async () => {
        try {
            const res = await api.get(`/notificaciones/usuario/${usuario.id}?page=0&size=${TAMANIO}`)
            const datos = res.data.content || res.data || []
            setNotificaciones(datos)
            setPagina(0)
            setHayMas(datos.length === TAMANIO)
        }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar las notificaciones.') } finally { setLoading(false) }
    }, [avisarCarga, usuario])

    const cargarMas = async () => {
        try {
            const res = await api.get(`/notificaciones/usuario/${usuario.id}?page=${pagina + 1}&size=${TAMANIO}`)
            const datos = res.data.content || res.data || []
            setNotificaciones(prev => [...prev, ...datos])
            setPagina(p => p + 1)
            setHayMas(datos.length === TAMANIO)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar más notificaciones.') }
    }

    const eliminar = async (e, id) => {
        e.stopPropagation() // que no abra la notificación
        try {
            await api.delete(`/notificaciones/${id}`)
            setNotificaciones(prev => prev.filter(n => n.idnotificacion !== id))
            refrescar()
        } catch (err) { avisar(err.response?.data?.mensaje || 'Error al eliminar') }
    }

    useEffect(() => { cargarNotificaciones() }, [cargarNotificaciones])

    const marcarLeida = async (id) => {
        try { await api.put(`/notificaciones/${id}/leida`); setNotificaciones(prev => prev.map(n => n.idnotificacion === id ? { ...n, leida: true } : n)); refrescar() }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido marcar como leída.') }
    }

    const marcarTodasLeidas = async () => {
        try { await api.put(`/notificaciones/usuario/${usuario.id}/leer-todas`); setNotificaciones(prev => prev.map(n => ({ ...n, leida: true }))); refrescar() }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido marcar como leídas.') }
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
            case 'LIKE_LISTA':
                if (n.idlista) navigate(`/lista/${n.idlista}`)
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

    if (loading) return <p className="text-texto-sec">Cargando…</p>

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-serif text-4xl leading-none text-texto">Notificaciones</h1>
                {notificaciones.some(n => !n.leida) && (
                    <button onClick={marcarTodasLeidas} className="text-sm text-acento hover:text-acento-hover transition-colors">Marcar todas como leídas</button>
                )}
            </div>
            {notificaciones.length === 0 ? <p className="font-serif text-xl text-texto-sec py-6">Todo en calma. No tienes ningún aviso.</p> : (
                <div className="divide-y divide-linea border-y border-linea">
                    {notificaciones.map((n) => (
                        <div key={n.idnotificacion} onClick={() => handleClick(n)} tabIndex={0}
                             onKeyDown={(e) => { if (e.key === 'Enter') handleClick(n) }}
                             className={`relative py-4 pl-5 pr-1 cursor-pointer hover:bg-superficie/60 ${n.leida ? 'text-texto-sec' : 'text-texto'}`}>
                            {/* Sin leer: un punto de acento a la izquierda */}
                            {!n.leida && <span aria-label="Sin leer" className="absolute left-0 top-[1.4rem] w-1.5 h-1.5 bg-acento rounded-full" />}
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-[15px] leading-snug">
                                    {n.tipo === 'NUEVO_SEGUIDOR' && n.nombreUsuarioOrigen ? (
                                        <><span className="text-texto font-medium">{n.nombreUsuarioOrigen}</span> ha empezado a seguirte</>
                                    ) : n.tipo === 'NUEVA_RESENA_SEGUIDO' && n.nombreUsuarioOrigen && n.tituloLibro ? (
                                        <><span className="text-texto font-medium">{n.nombreUsuarioOrigen}</span> ha reseñado <span className="font-serif italic text-texto">{n.tituloLibro}</span></>
                                    ) : n.tipo === 'NUEVA_RECOMENDACION' && n.nombreUsuarioOrigen && n.tituloLibro ? (
                                        <><span className="text-texto font-medium">{n.nombreUsuarioOrigen}</span> te ha recomendado <span className="font-serif italic text-texto">{n.tituloLibro}</span></>
                                    ) : n.tipo === 'LIKE_RESENA' && n.nombreUsuarioOrigen ? (
                                        <>A <span className="text-texto font-medium">{n.nombreUsuarioOrigen}</span> le ha gustado tu reseña</>
                                    ) : n.tipo === 'LIKE_CITA' && n.nombreUsuarioOrigen ? (
                                        <>A <span className="text-texto font-medium">{n.nombreUsuarioOrigen}</span> le ha gustado tu cita{n.tituloLibro && <> de <span className="font-serif italic text-texto">{n.tituloLibro}</span></>}</>
                                    ) : n.tipo === 'LIKE_LISTA' && n.nombreUsuarioOrigen ? (
                                        <>A <span className="text-texto font-medium">{n.nombreUsuarioOrigen}</span> le ha gustado tu lista{n.nombreLista && <> <span className="font-serif italic text-texto">{n.nombreLista}</span></>}</>
                                    ) : n.tipo === 'NUEVO_LIBRO_AUTOR' && n.tituloLibro ? (
                                        <>Nuevo libro: <span className="font-serif italic text-texto">{n.tituloLibro}</span></>
                                    ) : (
                                        n.mensaje
                                    )}
                                </p>
                                <button onClick={(e) => eliminar(e, n.idnotificacion)} title="Eliminar notificación" aria-label="Eliminar notificación"
                                        className="text-texto-ter hover:text-error flex-shrink-0 mt-0.5">
                                    <X size={14} />
                                </button>
                            </div>
                            <p className="text-xs text-texto-ter mt-1">{fechaHoraCorta(n.fecha)}</p>
                        </div>
                    ))}
                    {hayMas && (
                        <div className="flex justify-center py-5">
                            <button onClick={cargarMas}
                                    className="btn-secundario">
                                Cargar más
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}