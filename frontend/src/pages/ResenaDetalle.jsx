import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import api from '../api/axios'

export default function ResenaDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const [resena, setResena] = useState(null)
    const [liked, setLiked] = useState(false)
    const [loading, setLoading] = useState(true)
    const [eliminada, setEliminada] = useState(false)

    useEffect(() => { cargarResena() }, [id])

    const cargarResena = async () => {
        try {
            const res = await api.get(`/resenas/${id}`)
            setResena(res.data)
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        if (usuario && resena && resena.idusuario !== usuario.id && !eliminada) {
            comprobarLike()
        }
    }, [resena?.idresena])

    const comprobarLike = async () => {
        if (eliminada) return
        try {
            const res = await api.get(`/resenas/likes/${usuario.id}`)
            const likes = res.data.content || res.data || []
            setLiked(likes.some(r => r.idresena === parseInt(id)))
        } catch (err) { console.error('Error:', err) }
    }

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
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!resena) return <p className="text-red-400">Reseña no encontrada</p>
    if (eliminada) return <p className="text-dark-muted">Reseña eliminada</p>

    const ritmoLabels = ['', 'Lento', 'Medio', 'Rápido']

    return (
        <div className="max-w-2xl mx-auto">
            {/* Cabecera: libro + usuario */}
            <div className="flex gap-5 mb-8">
                <Link to={`/libro/${resena.idlibro}`} className="flex-shrink-0">
                    {resena.portadaLibro ? (
                        <img src={resena.portadaLibro} alt={resena.tituloLibro}
                             className="w-24 h-36 object-cover rounded-sm shadow-lg" />
                    ) : (
                        <div className="w-24 h-36 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted text-sm shadow-lg">
                            Sin portada
                        </div>
                    )}
                </Link>
                <div className="flex-1">
                    <Link to={`/libro/${resena.idlibro}`}
                          className="text-xl font-bold text-dark-text hover:text-terra transition-colors block mb-1">
                        {resena.tituloLibro}
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                        {resena.avatarUsuario ? (
                            <img src={resena.avatarUsuario} alt={resena.nombreUsuario} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                            <div className="w-6 h-6 bg-terra/20 rounded-full flex items-center justify-center text-terra text-xs font-bold">
                                {resena.nombreUsuario?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <Link to={`/usuario/${resena.idusuario}`}
                              className="text-dark-muted text-sm hover:text-terra transition-colors">
                            {resena.nombreUsuario}
                        </Link>
                        <span className="text-dark-muted text-xs">·</span>
                        <span className="text-dark-muted text-xs">{new Date(resena.fechaCreacion).toLocaleDateString()}</span>
                    </div>
                    <Estrellas puntuacion={resena.puntuacion} />
                    {resena.leidopreviamente && (
                        <span className="inline-block mt-2 text-xs bg-dark-elevated text-dark-muted px-2 py-0.5 rounded">Relectura</span>
                    )}
                </div>
            </div>

            {/* Ritmo */}
            {resena.ritmo && (
                <div className="flex items-center gap-3 mb-5">
                    <span className="text-dark-muted text-sm">Ritmo:</span>
                    <div className="flex gap-1">
                        {[1, 2, 3].map((r) => (
                            <span key={r} className={`text-lg transition-opacity ${resena.ritmo >= r ? 'opacity-100' : 'opacity-25'}`}>⚡</span>
                        ))}
                    </div>
                    <span className="text-dark-muted text-sm">{ritmoLabels[resena.ritmo]}</span>
                </div>
            )}

            {/* Etiquetas */}
            {resena.etiquetas?.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-6">
                    {resena.etiquetas.map((et) => (
                        <span key={et} className="text-xs bg-terra/10 text-terra px-3 py-1 rounded-full">{et}</span>
                    ))}
                </div>
            )}

            {/* Texto */}
            <div className="bg-dark-card rounded-2xl p-6 mb-6">
                {resena.tieneSpoiler ? (
                    <p className="text-dark-muted italic">Esta reseña contiene spoilers</p>
                ) : resena.texto ? (
                    <p className="text-dark-text/90 leading-relaxed">{resena.texto}</p>
                ) : (
                    <p className="text-dark-muted italic">Sin texto</p>
                )}
            </div>

            {/* Like + info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {usuario && resena.idusuario !== usuario.id && (
                        <button onClick={toggleLike} className="flex items-center gap-1.5 transition-colors">
                            {liked ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-dark-muted hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            )}
                            <span className={`text-sm ${liked ? 'text-red-500' : 'text-dark-muted'}`}>{resena.numLikes || 0}</span>
                        </button>
                    )}
                    {(!usuario || resena.idusuario === usuario.id) && (
                        <div className="flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="text-sm text-dark-muted">{resena.numLikes || 0}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {resena.esPublica ? (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Pública</span>
                    ) : (
                        <span className="text-xs bg-dark-elevated px-2 py-0.5 rounded-full">Privada</span>
                    )}
                    {usuario && (usuario.id === resena.idusuario || usuario.rol === 'ADMIN') && (
                        <button onClick={async () => {
                            if (!window.confirm('¿Eliminar esta reseña?')) return
                            setEliminada(true)
                            try {
                                await api.delete(`/resenas/${id}`)
                            } catch (err) {
                                // Ignorar — puede ser que la reseña ya no exista
                            }
                            navigate('/', { replace: true })
                        }}
                                className="text-red-400/60 hover:text-red-400 text-sm transition-colors">
                            Eliminar
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}