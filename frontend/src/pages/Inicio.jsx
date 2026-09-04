import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import api from '../api/axios'

export default function Inicio() {
    const { usuario } = useAuth()
    const [leyendo, setLeyendo] = useState([])
    const [leyendoIndex, setLeyendoIndex] = useState(0)
    const [retosActivos, setRetosActivos] = useState([])
    const [retoIndex, setRetoIndex] = useState(0)
    const [resenasSeguidos, setResenasSeguidos] = useState([])
    const [popularesAmigos, setPopularesAmigos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (usuario) {
            cargarLeyendo()
            cargarRetos()
            cargarResenasSeguidos()
            cargarPopularesAmigos()
        }
    }, [usuario])

    const cargarLeyendo = async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/estado/LEYENDO`)
            setLeyendo(res.data || [])
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const cargarRetos = async () => {
        try {
            const res = await api.get(`/retos/usuario/${usuario.id}/activos?size=10`)
            setRetosActivos(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }

    const cargarResenasSeguidos = async () => {
        try {
            const res = await api.get(`/resenas/seguidos/${usuario.id}?size=12`)
            setResenasSeguidos(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }

    const cargarPopularesAmigos = async () => {
        try {
            const res = await api.get(`/libros/populares-amigos/${usuario.id}?size=12`)
            setPopularesAmigos(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }

    if (!usuario) return <Navigate to="/landing" />
    if (loading) return <p className="text-dark-muted">Cargando...</p>

    const libroActual = leyendo[leyendoIndex]
    const retoActual = retosActivos[retoIndex]

    return (
        <div>
            {/* Saludo */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-dark-text tracking-tight">Hola, {usuario.nombre}</h1>
                <p className="text-dark-muted mt-1">¿Qué vas a leer hoy?</p>
            </div>

            {/* Grid principal: Leyendo (3/4) + Retos (1/4) */}
            <div className="flex gap-5 mb-12">
                {/* Leyendo ahora — 3/4 */}
                <div className="flex-[3] bg-dark-card rounded-2xl p-6 min-h-[280px]">
                    <div className="flex items-center justify-between mb-5">
                        {leyendo.length > 1 && (
                            <Link to="/perfil" className="text-xs text-dark-muted hover:text-terra transition-colors">
                                Ver todos ({leyendo.length})
                            </Link>
                        )}
                    </div>

                    {leyendo.length === 0 ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="text-center">
                                <p className="text-dark-muted mb-3">No estás leyendo nada</p>
                                <Link to="/catalogo" className="text-terra hover:text-terra-hover text-sm transition-colors">
                                    Explorar libros
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex gap-6">
                                <Link to={`/libro/${libroActual.idlibro}`} className="flex-shrink-0">
                                    {libroActual.portadaLibro ? (
                                        <img src={libroActual.portadaLibro} alt={libroActual.tituloLibro}
                                             className="w-32 h-48 object-cover rounded-xl shadow-lg" />
                                    ) : (
                                        <div className="w-32 h-48 bg-dark-elevated rounded-xl flex items-center justify-center text-dark-muted text-sm">
                                            Sin portada
                                        </div>
                                    )}
                                </Link>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <Link to={`/libro/${libroActual.idlibro}`}
                                              className="text-xl font-bold text-dark-text hover:text-terra transition-colors block mb-1">
                                            {libroActual.tituloLibro}
                                        </Link>
                                        <p className="text-dark-muted text-sm mb-4">{libroActual.nombreAutor || ''}</p>

                                        <div className="mb-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-dark-muted text-xs">Progreso</span>
                                                <span className="text-terra font-bold text-sm">{libroActual.porcentaje || 0}%</span>
                                            </div>
                                            <div className="bg-dark-border rounded-full h-2.5 w-full">
                                                <div className="bg-terra h-2.5 rounded-full transition-all duration-500"
                                                     style={{ width: `${libroActual.porcentaje || 0}%` }} />
                                            </div>
                                        </div>
                                        <p className="text-dark-muted text-xs">
                                            Página {libroActual.numPagina}{libroActual.totalPaginas ? ` de ${libroActual.totalPaginas}` : ''}
                                        </p>
                                    </div>

                                    <Link to={`/libro/${libroActual.idlibro}/seguimiento`}
                                          className="bg-terra hover:bg-terra-hover text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors self-start mt-4">
                                        Actualizar
                                    </Link>
                                </div>
                            </div>

                            {leyendo.length > 1 && (
                                <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-dark-border">
                                    <button onClick={() => setLeyendoIndex(i => i === 0 ? leyendo.length - 1 : i - 1)}
                                            className="text-dark-muted hover:text-terra transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="flex gap-1.5">
                                        {leyendo.map((_, i) => (
                                            <button key={i} onClick={() => setLeyendoIndex(i)}
                                                    className={`w-2 h-2 rounded-full transition-colors ${i === leyendoIndex ? 'bg-terra' : 'bg-dark-border hover:bg-dark-muted'}`} />
                                        ))}
                                    </div>
                                    <button onClick={() => setLeyendoIndex(i => i === leyendo.length - 1 ? 0 : i + 1)}
                                            className="text-dark-muted hover:text-terra transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Retos activos — 1/4 */}
                <div className="flex-[1] bg-dark-card rounded-2xl p-6 min-h-[280px]">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-dark-text">Retos</h2>
                        <Link to="/retos" className="text-xs text-dark-muted hover:text-terra transition-colors">Ver todos</Link>
                    </div>

                    {retosActivos.length === 0 ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="text-center">
                                <p className="text-dark-muted mb-3 text-sm">Sin retos activos</p>
                                <Link to="/retos" className="text-terra hover:text-terra-hover text-sm transition-colors">Explorar retos</Link>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-between h-[calc(100%-2rem)]">
                            <div>
                                <h3 className="text-dark-text font-medium text-sm mb-1">{retoActual.tituloReto || retoActual.titulo}</h3>
                                <div className="flex gap-1.5 mb-4">
                                    <span className="text-xs bg-terra/10 text-terra px-2 py-0.5 rounded-full">{retoActual.tipoReto || retoActual.tipo}</span>
                                    <span className="text-xs bg-dark-elevated text-dark-muted px-2 py-0.5 rounded-full">{retoActual.modalidadReto || retoActual.modalidad}</span>
                                </div>

                                <div className="flex items-center justify-center my-4">
                                    <div className="relative w-28 h-28">
                                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="#2a2a2a" strokeWidth="8" />
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="#c45d3e" strokeWidth="8"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${Math.min(100, retoActual.porcentaje || 0) * 2.64} 264`} />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-terra font-bold text-lg">{retoActual.porcentaje || 0}%</span>
                                            <span className="text-dark-muted text-xs">{retoActual.progreso}/{retoActual.meta}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {retosActivos.length > 1 && (
                                <div className="flex items-center justify-center gap-3 pt-3 border-t border-dark-border">
                                    <button onClick={() => setRetoIndex(i => i === 0 ? retosActivos.length - 1 : i - 1)}
                                            className="text-dark-muted hover:text-terra transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="flex gap-1.5">
                                        {retosActivos.map((_, i) => (
                                            <button key={i} onClick={() => setRetoIndex(i)}
                                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === retoIndex ? 'bg-terra' : 'bg-dark-border hover:bg-dark-muted'}`} />
                                        ))}
                                    </div>
                                    <button onClick={() => setRetoIndex(i => i === retosActivos.length - 1 ? 0 : i + 1)}
                                            className="text-dark-muted hover:text-terra transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Popular entre amigos */}
            {popularesAmigos.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-semibold text-dark-text">Popular entre tus amigos</h2>
                        <Link to="/catalogo" className="text-xs text-dark-muted hover:text-terra transition-colors">Ver más</Link>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {popularesAmigos.map((libro) => (
                            <Link key={libro.idlibro} to={`/libro/${libro.idlibro}`} className="group flex-shrink-0 w-36">
                                <div className="bg-dark-card rounded-xl overflow-hidden hover:bg-dark-elevated transition-colors">
                                    {libro.portada ? (
                                        <img src={libro.portada} alt={libro.titulo} className="w-full h-48 object-cover" />
                                    ) : (
                                        <div className="w-full h-48 bg-dark-elevated flex items-center justify-center text-dark-muted text-sm">Sin portada</div>
                                    )}
                                    <div className="p-2">
                                        <p className="text-sm text-dark-text truncate group-hover:text-terra transition-colors">{libro.titulo}</p>
                                        <p className="text-xs text-dark-muted truncate">{libro.nombreAutor}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Nuevas reseñas de amigos */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-semibold text-dark-text">Nuevas reseñas de amigos</h2>
                </div>

                {resenasSeguidos.length === 0 ? (
                    <div className="text-center py-10 bg-dark-card rounded-2xl">
                        <p className="text-dark-muted mb-2">Tus amigos aún no han reseñado libros</p>
                        <Link to="/buscar-usuarios" className="text-terra hover:text-terra-hover text-sm transition-colors">
                            Buscar lectores para seguir
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resenasSeguidos.map((resena) => (
                            <div key={resena.idresena} className="bg-dark-card rounded-xl p-5 flex gap-4 hover:bg-dark-elevated transition-colors">
                                <Link to={`/libro/${resena.idlibro}`} className="flex-shrink-0">
                                    {resena.portadaLibro ? (
                                        <img src={resena.portadaLibro} alt={resena.tituloLibro}
                                             className="w-16 h-24 object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-16 h-24 bg-dark-elevated rounded-lg flex items-center justify-center text-dark-muted text-xs">
                                            Sin portada
                                        </div>
                                    )}
                                </Link>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {resena.avatarUsuario ? (
                                            <img src={resena.avatarUsuario} alt={resena.nombreUsuario}
                                                 className="w-5 h-5 rounded-full object-cover" />
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

                                    <Link to={`/libro/${resena.idlibro}`}
                                          className="text-terra font-medium text-sm hover:text-terra-hover transition-colors block truncate mb-1">
                                        {resena.tituloLibro}
                                    </Link>

                                    <Estrellas puntuacion={resena.puntuacion} />

                                    {resena.texto && !resena.tieneSpoiler && (
                                        <p className="text-dark-text/70 text-xs mt-2 line-clamp-2">{resena.texto}</p>
                                    )}
                                    {resena.tieneSpoiler && (
                                        <p className="text-dark-muted text-xs mt-2 italic">Contiene spoilers</p>
                                    )}

                                    {resena.etiquetas?.length > 0 && (
                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                            {resena.etiquetas.slice(0, 3).map((et) => (
                                                <span key={et} className="text-xs bg-terra/10 text-terra px-2 py-0.5 rounded-full">{et}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}