import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import api from '../api/axios'
import SpoilerOculto from '../components/SpoilerOculto'
import { Heart, Lightning } from '@phosphor-icons/react'
import Portada from '../components/Portada'
import { useAvisos } from '../context/AvisosContext'
import { FRASES_RITMO } from '../utils/ritmo'
import { nombreEtiqueta } from '../utils/etiquetas'

export default function ResenaDetalle() {
    const { avisar, confirmar, avisarCarga } = useAvisos()
    const { id } = useParams()
    const { usuario } = useAuth()
    const [resena, setResena] = useState(null)
    const [liked, setLiked] = useState(false)
    const [loading, setLoading] = useState(true)
    const [eliminada, setEliminada] = useState(false)
    const navigate = useNavigate()

    const cargarResena = useCallback(async () => {
        try {
            const res = await api.get(`/resenas/${id}`)
            setResena(res.data)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar la reseña.') }
        finally { setLoading(false) }
    }, [avisarCarga, id])

    const comprobarLike = useCallback(async () => {
        if (eliminada) return
        try {
            const res = await api.get(`/resenas/likes/${usuario.id}`)
            const likes = res.data.content || res.data || []
            setLiked(likes.some(r => r.idresena === parseInt(id)))
        } catch (err) { console.error('Error:', err) }
    }, [eliminada, id, usuario])

    useEffect(() => { cargarResena() }, [cargarResena, id])
    const autorResena = resena?.idusuario
    useEffect(() => {
        if (usuario && autorResena != null && autorResena !== usuario.id && !eliminada) {
            comprobarLike()
        }
    }, [comprobarLike, eliminada, autorResena, usuario])

    const toggleLike = async () => {
        try {
            if (liked) {
                await api.delete(`/resenas/${id}/like/${usuario.id}`)
                setLiked(false)
                setResena(prev => ({ ...prev, numLikes: (prev.numLikes || 1) - 1 }))
            } else {
                await api.post(`/resenas/${id}/like/${usuario.id}`)
                setLiked(true)
                setResena(prev => ({ ...prev, numLikes: (prev.numLikes || 0) + 1 }))
            }
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }


    if (loading) return <p className="text-texto-sec">Cargando…</p>
    if (!resena) return <p className="font-serif text-2xl text-texto-sec">Esta reseña ya no está aquí.</p>
    if (eliminada) return <p className="text-texto-sec">Reseña eliminada</p>


    return (
        <div>
            {/* Cabecera sobre la portada difuminada: libro, autor de la reseña y nota */}
            <section className="relative isolate -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 pb-10">
                <div className="relative max-w-3xl mx-auto flex gap-6 sm:gap-8">
                    <Link to={`/libro/${resena.idlibro}`} className="group flex-shrink-0">
                        <Portada src={resena.portadaLibro} titulo={resena.tituloLibro} id={resena.idlibro} className="w-24 sm:w-32" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <p className="etiqueta mb-2">Reseña de</p>
                        <Link to={`/libro/${resena.idlibro}`}
                              className="font-serif text-3xl sm:text-4xl leading-[1.08] text-texto hover:text-acento block">
                            {resena.tituloLibro}
                        </Link>
                        <div className="mt-4"><Estrellas puntuacion={resena.puntuacion} /></div>
                        <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
                            {resena.avatarUsuario ? (
                                <img src={resena.avatarUsuario} alt="" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                                <span className="w-6 h-6 border border-linea rounded-full flex items-center justify-center text-texto-sec text-xs font-serif">
                                    {resena.nombreUsuario?.charAt(0).toUpperCase()}
                                </span>
                            )}
                            <Link to={`/usuario/${resena.idusuario}`} className="text-texto-sec hover:text-acento">
                                {resena.nombreUsuario}
                            </Link>
                            <span className="text-texto-ter text-xs">· {new Date(resena.fechaCreacion).toLocaleDateString()}</span>
                            {resena.leidopreviamente && (
                                <span className="text-xs text-texto-sec border border-linea px-1.5 rounded">Relectura</span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <article className="max-w-3xl mx-auto">
                {/* El texto, en serif de lectura */}
                <div className="border-t border-linea pt-8">
                    {resena.texto ? (
                        <SpoilerOculto activo={resena.tieneSpoiler && usuario?.id !== resena.idusuario}>
                            <p className="font-serif text-[18px] leading-[1.7] text-texto/90 max-w-[65ch] whitespace-pre-line">{resena.texto}</p>
                        </SpoilerOculto>
                    ) : (
                        <p className="font-serif italic text-texto-sec">Sin palabras: solo la nota.</p>
                    )}
                </div>

                {/* Ritmo y ambiente */}
                {(resena.ritmo || resena.etiquetas?.length > 0) && (
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-8">
                        {resena.ritmo ? (
                            <div className="flex items-center gap-2">
                                <span className="etiqueta">Ritmo</span>
                                <span className="flex gap-0.5 text-acento">
                                    {[1, 2, 3].map((r) => (
                                        <Lightning key={r} size={16} weight={resena.ritmo >= r ? 'fill' : 'light'}
                                                   className={resena.ritmo >= r ? '' : 'opacity-40'} />
                                    ))}
                                </span>
                                <span className="text-texto-sec text-sm">{FRASES_RITMO[resena.ritmo]}</span>
                            </div>
                        ) : null}
                        {resena.etiquetas?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="etiqueta mr-1">Ambiente</span>
                                {resena.etiquetas.map((et) => (
                                    <span key={et} className="text-xs text-texto-sec border border-linea px-2 py-0.5 rounded">{nombreEtiqueta(et)}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Me gusta y acciones */}
                <div className="flex items-center justify-between mt-10 pt-5 border-t border-linea text-sm">
                    <div className="flex items-center gap-4">
                        {usuario && resena.idusuario !== usuario.id ? (
                            <button onClick={toggleLike} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
                                    className={`flex items-center gap-1.5 ${liked ? 'text-acento' : 'text-texto-sec hover:text-acento'}`}>
                                <Heart size={18} weight={liked ? 'fill' : 'regular'} />
                                <span className="tabular-nums">{resena.numLikes || 0}</span>
                            </button>
                        ) : (
                            <span className="flex items-center gap-1.5 text-texto-sec">
                                <Heart size={18} />
                                <span className="tabular-nums">{resena.numLikes || 0}</span>
                            </span>
                        )}
                        <span className="text-xs text-texto-ter">{resena.esPublica ? 'Pública' : 'Privada'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {usuario && usuario.id === resena.idusuario && (
                            <button onClick={() => navigate(`/libro/${resena.idlibro}/resena?editar=${id}`)}
                                    className="text-texto-sec hover:text-texto">
                                Editar
                            </button>
                        )}
                        {usuario && (usuario.id === resena.idusuario || usuario.rol === 'ADMIN') && (
                            <button onClick={async () => {
                                if (!await confirmar({ titulo: '¿Eliminar esta reseña?', texto: 'Se borrará para siempre. No se puede deshacer.', aceptar: 'Eliminar', peligro: true })) return
                                try {
                                    await api.delete(`/resenas/${id}`)
                                } catch (err) {
                                    avisar(err.response?.data?.mensaje || 'No se ha podido eliminar la reseña')
                                    return
                                }
                                setEliminada(true)
                                // De vuelta a la ficha del libro (tu nota se queda como puntuación sin reseña)
                                navigate(`/libro/${resena.idlibro}`, { replace: true })
                            }}
                                    className="text-texto-ter hover:text-error">
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>
            </article>
        </div>
    )
}
