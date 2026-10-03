import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from './Estrellas'
import SpoilerOculto from './SpoilerOculto'
import api from '../api/axios'
import { Heart } from '@phosphor-icons/react'
import Portada from './Portada'
import { useAvisos } from '../context/AvisosContext'

export default function ResenaCard({ resena: resenaInicial, mostrarLibro = true, mostrarUsuario = true }) {
    const { avisar, confirmar, avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [resena, setResena] = useState(resenaInicial)
    const [liked, setLiked] = useState(false)

    const comprobarLike = useCallback(async () => {
        try {
            const res = await api.get(`/resenas/likes/${usuario.id}`)
            const likes = res.data.content || res.data || []
            setLiked(likes.some(r => r.idresena === resenaInicial.idresena))
        } catch (err) { console.error('Error:', err) }
    }, [resenaInicial.idresena, usuario])

    useEffect(() => {
        if (usuario && resenaInicial.idusuario !== usuario.id) {
            comprobarLike()
        }
    }, [comprobarLike, resenaInicial.idresena, resenaInicial.idusuario, usuario])

    const toggleLike = async (e) => {
        e.stopPropagation()
        if (!usuario || resena.idusuario === usuario.id) return
        try {
            if (liked) {
                await api.delete(`/resenas/${resena.idresena}/like/${usuario.id}`)
                setLiked(false)
                setResena(prev => ({ ...prev, numLikes: (prev.numLikes || 1) - 1 }))
            } else {
                await api.post(`/resenas/${resena.idresena}/like/${usuario.id}`)
                setLiked(true)
                setResena(prev => ({ ...prev, numLikes: (prev.numLikes || 0) + 1 }))
            }
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido guardar el me gusta.') }
    }

    // El detalle de una reseña requiere cuenta
    const irADetalle = () => {
        navigate(usuario ? `/resena/${resena.idresena}` : '/login')
    }

    const eliminarResena = async (e) => {
        e.stopPropagation()
        if (!await confirmar({ titulo: '¿Eliminar esta reseña?', texto: 'Se borrará para siempre. No se puede deshacer.', aceptar: 'Eliminar', peligro: true })) return
        try {
            await api.delete(`/resenas/${resena.idresena}`)
            window.location.reload()
        } catch (err) {
            avisar(err.response?.data?.mensaje || 'Error al eliminar')
        }
    }

    return (
        <article onClick={irADetalle} onKeyDown={(e) => { if (e.key === 'Enter') irADetalle() }} tabIndex={0}
                 className="group/resena flex gap-5 py-6 border-b border-linea cursor-pointer focus-visible:outline-offset-4">
            {/* Portada del libro */}
            {mostrarLibro && (
                <div className="group flex-shrink-0 self-start"
                     onClick={(e) => { e.stopPropagation(); navigate(`/libro/${resena.idlibro}`) }}>
                    <Portada src={resena.portadaLibro} titulo={resena.tituloLibro} id={resena.idlibro} className="w-16" />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        {mostrarLibro && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/libro/${resena.idlibro}`) }}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    className="font-serif text-lg leading-snug text-texto hover:text-acento block max-w-full truncate text-left">
                                {resena.tituloLibro}
                            </button>
                        )}
                        {/* Nota discreta */}
                        <div className="scale-75 origin-left -my-0.5">
                            <Estrellas puntuacion={resena.puntuacion} />
                        </div>
                    </div>

                    {/* Autor, pequeño, arriba a la derecha */}
                    {mostrarUsuario && (
                        <button className="flex items-center gap-2 flex-shrink-0 text-texto-sec hover:text-acento"
                                onClick={(e) => { e.stopPropagation(); navigate(`/usuario/${resena.idusuario}`) }}>
                            {resena.avatarUsuario ? (
                                <img src={resena.avatarUsuario} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                                <span className="w-5 h-5 border border-linea rounded-full flex items-center justify-center text-[10px] font-serif">
                                    {resena.nombreUsuario?.charAt(0).toUpperCase()}
                                </span>
                            )}
                            <span className="text-xs">{resena.nombreUsuario}</span>
                        </button>
                    )}
                </div>

                {resena.texto && (
                    <SpoilerOculto activo={resena.tieneSpoiler && usuario?.id !== resena.idusuario}>
                        <p className="font-serif text-[17px] leading-[1.65] text-texto/90 mt-2 line-clamp-4 max-w-[65ch] whitespace-pre-line">
                            {resena.texto}
                        </p>
                    </SpoilerOculto>
                )}
                {resena.tieneSpoiler && usuario?.id === resena.idusuario && (
                    <p className="text-acento text-xs mt-1">Marcada con spoilers</p>
                )}

                {/* Pie: me gusta, acciones y fecha */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 text-xs">
                        <button onClick={toggleLike} disabled={!usuario || resena.idusuario === usuario?.id}
                                aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
                                className={`flex items-center gap-1 ${liked ? 'text-acento' : 'text-texto-sec enabled:hover:text-acento'}`}>
                            <Heart size={15} weight={liked ? 'fill' : 'regular'} />
                            <span className="tabular-nums">{resena.numLikes || 0}</span>
                        </button>
                        {usuario && usuario.id === resena.idusuario && (
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/libro/${resena.idlibro}/resena?editar=${resena.idresena}`) }}
                                    className="text-texto-sec hover:text-texto">
                                Editar
                            </button>
                        )}
                        {usuario && (usuario.id === resena.idusuario || usuario.rol === 'ADMIN') && (
                            <button onClick={eliminarResena} className="text-texto-ter hover:text-error">
                                Eliminar
                            </button>
                        )}
                    </div>
                    <span className="text-texto-ter text-xs">
                        {new Date(resena.fechaCreacion).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </article>
    )
}
