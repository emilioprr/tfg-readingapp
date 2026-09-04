import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import api from '../api/axios'

export default function Perfil() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const perfilId = id ? parseInt(id) : usuario?.id
    const esMio = usuario && usuario.id === perfilId

    const [perfil, setPerfil] = useState(null)
    const [favoritos, setFavoritos] = useState([])
    const [lecturasRecientes, setLecturasRecientes] = useState([])
    const [resenas, setResenas] = useState([])
    const [listas, setListas] = useState([])
    const [siguiendo, setSiguiendo] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (perfilId) {
            cargarPerfil()
            cargarFavoritos()
            cargarLecturasRecientes()
            cargarResenas()
            cargarListas()
        }
    }, [perfilId])

    const cargarPerfil = async () => {
        try { const res = await api.get(`/usuarios/${perfilId}`); setPerfil(res.data) }
        catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const cargarFavoritos = async () => {
        try { const res = await api.get(`/libros/favoritos/${perfilId}`); setFavoritos(res.data || []) }
        catch (err) { console.error('Error:', err) }
    }

    const cargarLecturasRecientes = async () => {
        try {
            const endpoint = esMio
                ? `/seguimientos/usuario/${perfilId}/estado/LEIDO`
                : `/seguimientos/usuario/${perfilId}/estado/LEIDO`
            const res = await api.get(endpoint)
            setLecturasRecientes(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }

    const cargarResenas = async () => {
        try {
            const endpoint = esMio
                ? `/resenas/usuario/${perfilId}?size=5`
                : `/resenas/usuario/${perfilId}/publicas?size=5`
            const res = await api.get(endpoint)
            setResenas(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }

    const cargarListas = async () => {
        try { const res = await api.get(`/listas/usuario/${perfilId}`); setListas(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }

    const toggleSeguir = async () => {
        try {
            if (siguiendo) await api.delete(`/usuarios/${usuario.id}/seguir/${perfilId}`)
            else await api.post(`/usuarios/${usuario.id}/seguir/${perfilId}`)
            setSiguiendo(!siguiendo)
            cargarPerfil()
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!perfil) return <p className="text-red-400">Usuario no encontrado</p>

    const favoritosSlots = [...favoritos.slice(0, 5)]
    while (favoritosSlots.length < 5) favoritosSlots.push(null)

    return (
        <div className="max-w-4xl mx-auto">

            {/* Header */}
            <div className="text-center mb-12">
                <div className="flex justify-center mb-4">
                    {perfil.avatar ? (
                        <img src={perfil.avatar} alt={perfil.nombre}
                             className="w-28 h-28 rounded-full object-cover ring-4 ring-dark-border" />
                    ) : (
                        <div className="w-28 h-28 bg-terra/20 rounded-full flex items-center justify-center text-terra text-5xl font-bold ring-4 ring-dark-border">
                            {perfil.nombre?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <h1 className="text-3xl font-bold text-dark-text tracking-tight mb-1">{perfil.nombre}</h1>

                {perfil.biografia ? (
                    <p className="text-dark-muted text-sm max-w-md mx-auto leading-relaxed mt-2">{perfil.biografia}</p>
                ) : (
                    <p className="text-dark-muted/50 text-sm mt-2 italic">Sin biografía</p>
                )}

                <div className="flex items-center justify-center gap-6 mt-4 text-sm text-dark-muted">
                    <span>{perfil.seguidores || 0} seguidores</span>
                    <span className="w-1 h-1 bg-dark-border rounded-full" />
                    <span>Miembro desde {perfil.fechaAlta}</span>
                </div>

                <div className="mt-4">
                    {esMio ? (
                        <Link to="/editar-perfil"
                              className="inline-block border border-dark-border text-dark-muted hover:border-terra hover:text-terra px-4 py-1.5 rounded-lg text-sm transition-colors">
                            Editar perfil
                        </Link>
                    ) : usuario && (
                        <button onClick={toggleSeguir}
                                className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                    siguiendo
                                        ? 'border border-dark-border text-dark-text hover:border-red-400 hover:text-red-400'
                                        : 'bg-terra hover:bg-terra-hover text-white'
                                }`}>
                            {siguiendo ? 'Dejar de seguir' : 'Seguir'}
                        </button>
                    )}
                </div>
            </div>

            {/* Libros Favoritos */}
            <div className="mb-12">
                <h2 className="text-lg font-semibold text-dark-text mb-5">Libros Favoritos</h2>
                <div className="grid grid-cols-5 gap-4">
                    {favoritosSlots.map((libro, i) => (
                        <div key={libro ? libro.idlibro : `empty-${i}`}>
                            {libro ? (
                                <Link to={`/libro/${libro.idlibro}`} className="group block">
                                    <div className="bg-dark-card rounded-xl overflow-hidden hover:bg-dark-elevated transition-colors">
                                        {libro.portada ? (
                                            <img src={libro.portada} alt={libro.titulo} className="w-full h-44 object-cover" />
                                        ) : (
                                            <div className="w-full h-44 bg-dark-elevated flex items-center justify-center text-dark-muted text-sm">
                                                Sin portada
                                            </div>
                                        )}
                                        <div className="p-2">
                                            <p className="text-xs text-dark-text truncate group-hover:text-terra transition-colors">{libro.titulo}</p>
                                            <p className="text-xs text-dark-muted truncate">{libro.nombreAutor}</p>
                                        </div>
                                    </div>
                                </Link>
                            ) : esMio ? (
                                <Link to="/catalogo" className="block">
                                    <div className="border-2 border-dashed border-dark-border rounded-xl h-[13.5rem] flex flex-col items-center justify-center hover:border-terra/40 transition-colors group cursor-pointer">
                                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-dark-border group-hover:border-terra/40 flex items-center justify-center mb-2 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-dark-muted group-hover:text-terra transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-dark-muted group-hover:text-terra transition-colors">Añadir</span>
                                    </div>
                                </Link>
                            ) : (
                                <div className="border-2 border-dashed border-dark-border/30 rounded-xl h-[13.5rem] flex items-center justify-center">
                                    <span className="text-xs text-dark-muted/30">Vacío</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Lecturas Recientes */}
            <div className="mb-12">
                <h2 className="text-lg font-semibold text-dark-text mb-5">Lecturas Recientes</h2>
                {lecturasRecientes.length === 0 ? (
                    <div className="text-center py-8 bg-dark-card rounded-2xl">
                        <p className="text-dark-muted text-sm">
                            {esMio ? 'No has terminado ningún libro todavía' : 'Este usuario no ha terminado ningún libro'}
                        </p>
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {lecturasRecientes.map((s) => (
                            <Link key={s.idseguimiento} to={`/libro/${s.idlibro}`} className="group flex-shrink-0 w-36">
                                <div className="bg-dark-card rounded-xl overflow-hidden hover:bg-dark-elevated transition-colors">
                                    {s.portadaLibro ? (
                                        <img src={s.portadaLibro} alt={s.tituloLibro} className="w-full h-48 object-cover" />
                                    ) : (
                                        <div className="w-full h-48 bg-dark-elevated flex items-center justify-center text-dark-muted text-sm">
                                            Sin portada
                                        </div>
                                    )}
                                    <div className="p-2">
                                        <p className="text-sm text-dark-text truncate group-hover:text-terra transition-colors">{s.tituloLibro}</p>
                                        <p className="text-xs text-dark-muted mt-0.5">{s.fecha}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Reseñas Recientes */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-dark-text">
                        {esMio ? 'Reseñas Recientes' : 'Reseñas Públicas'}
                    </h2>
                    {esMio && resenas.length > 0 && (
                        <Link to="/mis-resenas" className="text-xs text-dark-muted hover:text-terra transition-colors">
                            Ver todas
                        </Link>
                    )}
                </div>
                {resenas.length === 0 ? (
                    <div className="text-center py-8 bg-dark-card rounded-2xl">
                        <p className="text-dark-muted text-sm">
                            {esMio ? 'No has escrito reseñas todavía' : 'No tiene reseñas públicas'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {resenas.map((r) => (
                            <div key={r.idresena} className="bg-dark-card rounded-xl p-5 flex gap-4 hover:bg-dark-elevated transition-colors">
                                <Link to={`/libro/${r.idlibro}`} className="flex-shrink-0">
                                    {r.portadaLibro ? (
                                        <img src={r.portadaLibro} alt={r.tituloLibro} className="w-14 h-20 object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-14 h-20 bg-dark-elevated rounded-lg flex items-center justify-center text-dark-muted text-xs">
                                            Sin portada
                                        </div>
                                    )}
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <Link to={`/libro/${r.idlibro}`}
                                              className="text-terra font-medium text-sm hover:text-terra-hover transition-colors truncate">
                                            {r.tituloLibro}
                                        </Link>
                                        <Estrellas puntuacion={r.puntuacion} />
                                    </div>
                                    {r.tieneSpoiler ? (
                                        <p className="text-dark-muted text-sm italic">Contiene spoilers</p>
                                    ) : r.texto ? (
                                        <p className="text-dark-text/70 text-sm line-clamp-2">{r.texto}</p>
                                    ) : null}
                                    {r.etiquetas?.length > 0 && (
                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                            {r.etiquetas.slice(0, 4).map((et) => (
                                                <span key={et} className="text-xs bg-terra/10 text-terra px-2 py-0.5 rounded-full">{et}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-3 mt-2 text-xs text-dark-muted">
                                        <span>{new Date(r.fechaCreacion).toLocaleDateString()}</span>
                                        <span>{r.numLikes || 0} likes</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Listas — solo en perfil propio */}
            {esMio && (
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-dark-text">Mis Listas</h2>
                        <Link to="/crear-lista"
                              className="text-sm bg-terra hover:bg-terra-hover text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
                            + Nueva lista
                        </Link>
                    </div>
                    {listas.length === 0 ? (
                        <div className="text-center py-8 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted text-sm">No tienes listas todavía</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {listas.map((lista) => (
                                <Link key={lista.idlista} to={`/lista/${lista.idlista}`}
                                      className="bg-dark-card rounded-xl p-4 hover:bg-dark-elevated transition-colors">
                                    <p className="text-terra font-medium">{lista.nombre}</p>
                                    {lista.descripcion && <p className="text-dark-muted text-sm mt-1 truncate">{lista.descripcion}</p>}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}