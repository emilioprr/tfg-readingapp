import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from './Estrellas'
import api from '../api/axios'

export default function ResenaCard({ resena: resenaInicial, mostrarLibro = true, mostrarUsuario = true }) {
    const { usuario } = useAuth()
    const [resena, setResena] = useState(resenaInicial)
    const [liked, setLiked] = useState(false)

    const toggleLike = async (e) => {
        e.preventDefault()
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
        } catch (err) { console.error('Error:', err) }
    }

    return (
        <div className="bg-dark-card rounded-xl p-5 hover:bg-dark-elevated transition-colors">
            <div className="flex gap-4">
                {/* Portada */}
                {mostrarLibro && (
                    <Link to={`/libro/${resena.idlibro}`} className="flex-shrink-0">
                        {resena.portadaLibro ? (
                            <img src={resena.portadaLibro} alt={resena.tituloLibro} className="w-14 h-20 object-cover rounded-sm" />
                        ) : (
                            <div className="w-14 h-20 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted text-xs">
                                Sin portada
                            </div>
                        )}
                    </Link>
                )}

                <div className="flex-1 min-w-0">
                    {/* Usuario y fecha */}
                    {mostrarUsuario && (
                        <div className="flex items-center gap-2 mb-1">
                            {resena.avatarUsuario ? (
                                <img src={resena.avatarUsuario} alt={resena.nombreUsuario} className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                                <div className="w-5 h-5 bg-terra/20 rounded-full flex items-center justify-center text-terra text-xs font-bold">
                                    {resena.nombreUsuario?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <Link to={`/usuario/${resena.idusuario}`}
                                  className="text-dark-text text-sm font-medium hover:text-terra transition-colors truncate">
                                {resena.nombreUsuario}
                            </Link>
                            <span className="text-dark-muted text-xs flex-shrink-0">
                {new Date(resena.fechaCreacion).toLocaleDateString()}
              </span>
                        </div>
                    )}

                    {/* Título del libro */}
                    {mostrarLibro && (
                        <Link to={`/resena/${resena.idresena}`}
                              className="text-terra font-medium text-sm hover:text-terra-hover transition-colors block truncate mb-1">
                            {resena.tituloLibro}
                        </Link>
                    )}

                    {/* Estrellas */}
                    <Estrellas puntuacion={resena.puntuacion} />

                    {/* Texto */}
                    {resena.texto && !resena.tieneSpoiler && (
                        <Link to={`/resena/${resena.idresena}`}>
                            <p className="text-dark-text/70 text-xs mt-2 line-clamp-2 hover:text-dark-text/90 transition-colors">{resena.texto}</p>
                        </Link>
                    )}
                    {resena.tieneSpoiler && (
                        <p className="text-dark-muted text-xs mt-2 italic">Contiene spoilers</p>
                    )}

                    {/* Etiquetas */}
                    {resena.etiquetas?.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                            {resena.etiquetas.slice(0, 3).map((et) => (
                                <span key={et} className="text-xs bg-terra/10 text-terra px-2 py-0.5 rounded-full">{et}</span>
                            ))}
                        </div>
                    )}

                    {/* Like */}
                    <div className="flex items-center gap-3 mt-3">
                        <button onClick={toggleLike}
                                className="flex items-center gap-1 transition-colors"
                                disabled={!usuario || resena.idusuario === usuario?.id}>
                            {liked ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-muted hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            )}
                            <span className={`text-xs ${liked ? 'text-red-500' : 'text-dark-muted'}`}>{resena.numLikes || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}