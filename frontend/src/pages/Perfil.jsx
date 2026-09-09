import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import ResenaCard from '../components/ResenaCard'
import LibroCard from '../components/LibroCard'
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
    const [anotaciones, setAnotaciones] = useState([])
    const [siguiendo, setSiguiendo] = useState(false)
    const [loading, setLoading] = useState(true)
    const [wishlist, setWishlist] = useState(null)
    const [listasPublicas, setListasPublicas] = useState([])
    const [tab, setTab] = useState('libros')

    useEffect(() => {
        if (perfilId) {
            cargarPerfil()
            cargarFavoritos()
            cargarLecturasRecientes()
            cargarResenas()
            cargarAnotaciones()
            cargarWishlist()
            cargarListasPublicas()
            comprobarSiguiendo()
        }
    }, [perfilId])

    const cargarPerfil = async () => {
        try { const res = await api.get(`/usuarios/${perfilId}`); setPerfil(res.data) }
        catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const cargarFavoritos = async () => {
        try {
            const res = await api.get(`/libros/favoritos/${perfilId}`)
            const datos = res.data || []
            datos.sort((a, b) => a.idlibro - b.idlibro)
            setFavoritos(datos)
        } catch (err) { console.error('Error:', err) }
    }

    const cargarLecturasRecientes = async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${perfilId}/estado/LEIDO`)
            setLecturasRecientes(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }

    const cargarResenas = async () => {
        try {
            const endpoint = esMio
                ? `/resenas/usuario/${perfilId}?size=20`
                : `/resenas/usuario/${perfilId}/publicas?size=20`
            const res = await api.get(endpoint)
            const datos = res.data.content || res.data || []
            datos.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
            setResenas(datos)
        } catch (err) { console.error('Error:', err) }
    }

    const cargarAnotaciones = async () => {
        try {
            const res = await api.get(`/anotaciones/usuario/${perfilId}`)
            setAnotaciones(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }

    const cargarWishlist = async () => {
        try {
            const res = await api.get(`/listas/usuario/${perfilId}`)
            const listas = res.data.content || res.data || []
            const wl = listas.find(l => l.esAutomatica && l.nombre === 'Wishlist')
            if (wl) {
                const detalle = await api.get(`/listas/${wl.idlista}`)
                setWishlist(detalle.data)
            }
        } catch (err) { console.error('Error:', err) }
    }

    const cargarListasPublicas = async () => {
        try {
            const res = await api.get(`/listas/usuario/${perfilId}`)
            const listas = res.data.content || res.data || []
            const propio = usuario && parseInt(perfilId) === usuario.id
            if (propio) {
                setListasPublicas(listas.filter(l => !l.esAutomatica))
            } else {
                setListasPublicas(listas.filter(l => l.esPublica && !l.esAutomatica))
            }
        } catch (err) { console.error('Error:', err) }
    }

    const toggleSeguir = async () => {
        try {
            if (siguiendo) await api.delete(`/usuarios/${usuario.id}/seguir/${perfilId}`)
            else await api.post(`/usuarios/${usuario.id}/seguir/${perfilId}`)
            setSiguiendo(!siguiendo)
            cargarPerfil()
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    const quitarFavorito = async (idlibro) => {
        try {
            await api.delete(`/libros/${idlibro}/favorito/${perfilId}`)
            cargarFavoritos()
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    const comprobarSiguiendo = async () => {
        if (!usuario || esMio) return
        try {
            const res = await api.get(`/usuarios/${usuario.id}/seguidos`)
            const seguidos = res.data || []
            setSiguiendo(seguidos.some(u => u.idusuario === perfilId))
        } catch (err) { console.error('Error:', err) }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!perfil) return <p className="text-red-400">Usuario no encontrado</p>

    const favoritosSlots = [...favoritos.slice(0, 5)]
    while (favoritosSlots.length < 5) favoritosSlots.push(null)

    const tabs = [
        { key: 'libros', label: 'Libros' },
        { key: 'wishlist', label: 'Wishlist' },
        { key: 'resenas', label: 'Reseñas' },
        { key: 'anotaciones', label: 'Anotaciones' },
        { key: 'listas', label: 'Listas' },
    ]

    return (
        <div className="max-w-4xl mx-auto">

            {/* Header */}
            <div className="text-center mb-8">
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

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-dark-border justify-center">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                                tab === t.key ? 'text-terra' : 'text-dark-muted hover:text-dark-text'
                            }`}>
                        {t.label}
                        {tab === t.key && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terra rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab: Libros */}
            {tab === 'libros' && (
                <>
                    {/* Favoritos */}
                    <div className="mb-12">
                        <h2 className="text-lg font-semibold text-dark-text mb-5">Libros favoritos</h2>
                        <div className="grid grid-cols-5 gap-x-4 gap-y-6">
                            {favoritosSlots.map((libro, i) => (
                                <div key={libro ? libro.idlibro : `empty-${i}`}>
                                    {libro ? (
                                        <div className="group relative">
                                            <Link to={`/libro/${libro.idlibro}`} className="block">
                                                {libro.portada ? (
                                                    <img src={libro.portada} alt={libro.titulo}
                                                         className="w-full h-56 object-cover rounded-sm shadow-md group-hover:shadow-xl transition-shadow" />
                                                ) : (
                                                    <div className="w-full h-56 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted text-sm shadow-md">
                                                        Sin portada
                                                    </div>
                                                )}
                                                <p className="text-xs text-dark-text truncate mt-2 group-hover:text-terra transition-colors">{libro.titulo}</p>
                                                <p className="text-xs text-dark-muted truncate">{libro.nombreAutor}</p>
                                            </Link>
                                            {esMio && (
                                                <button onClick={() => quitarFavorito(libro.idlibro)}
                                                        className="absolute top-1 right-1 bg-black/60 text-red-400 hover:text-red-300 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ) : esMio ? (
                                        <Link to="/catalogo" className="block">
                                            <div className="border-2 border-dashed border-dark-border h-56 flex flex-col items-center justify-center hover:border-terra/40 transition-colors group cursor-pointer">
                                                <div className="w-10 h-10 rounded-full border-2 border-dashed border-dark-border group-hover:border-terra/40 flex items-center justify-center mb-2 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-dark-muted group-hover:text-terra transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </div>
                                                <span className="text-xs text-dark-muted group-hover:text-terra transition-colors">Añadir</span>
                                            </div>
                                            <p className="text-xs text-transparent mt-2">-</p>
                                            <p className="text-xs text-transparent">-</p>
                                        </Link>
                                    ) : (
                                        <div>
                                            <div className="border-2 border-dashed border-dark-border/30 h-56 flex items-center justify-center">
                                                <span className="text-xs text-dark-muted/30">Vacío</span>
                                            </div>
                                            <p className="text-xs text-transparent mt-2">-</p>
                                            <p className="text-xs text-transparent">-</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lecturas recientes */}
                    <div className="mb-12">
                        <h2 className="text-lg font-semibold text-dark-text mb-5">Lecturas recientes</h2>
                        {lecturasRecientes.length === 0 ? (
                            <div className="text-center py-8 bg-dark-card rounded-2xl">
                                <p className="text-dark-muted text-sm">
                                    {esMio ? 'No has terminado ningún libro todavía' : 'No ha terminado ningún libro'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex gap-5 overflow-x-auto pb-2">
                                {lecturasRecientes.map((s) => (
                                    <Link key={s.idseguimiento} to={`/libro/${s.idlibro}`} className="group flex-shrink-0 w-40">
                                        {s.portadaLibro ? (
                                            <img src={s.portadaLibro} alt={s.tituloLibro}
                                                 className="w-full h-56 object-cover shadow-md group-hover:shadow-xl transition-shadow" />
                                        ) : (
                                            <div className="w-full h-56 bg-dark-elevated flex items-center justify-center text-dark-muted text-sm shadow-md">
                                                Sin portada
                                            </div>
                                        )}
                                        <p className="text-sm text-dark-text truncate mt-2 group-hover:text-terra transition-colors">{s.tituloLibro}</p>
                                        <p className="text-xs text-dark-muted">{s.fecha}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Tab: Wishlist */}
            {tab === 'wishlist' && (
                <div>
                    {!wishlist || (wishlist.libros || []).length === 0 ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted text-sm">
                                {esMio ? 'Tu wishlist está vacía' : 'Wishlist vacía'}
                            </p>
                            {esMio && (
                                <Link to="/catalogo" className="text-terra hover:text-terra-hover text-sm transition-colors mt-2 inline-block">
                                    Explorar libros
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
                            {(wishlist.libros || []).map((libro) => (
                                <LibroCard key={libro.idlibro} libro={libro} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Reseñas */}
            {tab === 'resenas' && (
                <div>
                    {resenas.length === 0 ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted text-sm">
                                {esMio ? 'No has escrito reseñas todavía' : 'No tiene reseñas públicas'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {resenas.map((r) => (
                                <ResenaCard key={r.idresena} resena={r} mostrarUsuario={false} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Anotaciones */}
            {tab === 'anotaciones' && (
                <div>
                    {anotaciones.length === 0 ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted text-sm">
                                {esMio ? 'No tienes anotaciones todavía' : 'No tiene anotaciones'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {anotaciones.map((a) => (
                                <div key={a.idanotacion} className="bg-dark-card rounded-xl p-5 hover:bg-dark-elevated transition-colors flex gap-4">
                                    <Link to={`/libro/${a.idlibro}`} className="flex-shrink-0">
                                        {a.portadaLibro ? (
                                            <img src={a.portadaLibro} alt={a.tituloLibro} className="w-14 h-20 object-cover rounded-sm" />
                                        ) : (
                                            <div className="w-14 h-20 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted text-xs">
                                                📖
                                            </div>
                                        )}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <Link to={`/libro/${a.idlibro}`} className="text-terra font-medium text-sm hover:text-terra-hover transition-colors truncate">
                                                {a.tituloLibro}
                                            </Link>
                                            <span className="text-dark-muted text-xs flex-shrink-0 ml-2">{new Date(a.fecha).toLocaleDateString()}</span>
                                        </div>
                                        {a.titulo && <p className="text-dark-text font-medium text-sm mb-1">{a.titulo}</p>}
                                        <p className="text-dark-text/70 text-sm">{a.texto}</p>
                                        {(a.parte || a.numPagina) && (
                                            <p className="text-dark-muted text-xs mt-2">
                                                {a.parte && <span>{a.parte}</span>}
                                                {a.parte && a.numPagina && <span> · </span>}
                                                {a.numPagina && <span>Página {a.numPagina}</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Listas */}
            {tab === 'listas' && (
                <>
                    {/* Wishlist */}
                    {wishlist && (wishlist.libros || []).length > 0 && (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-semibold text-dark-text">
                                    {esMio ? 'Mi Wishlist' : `Wishlist de ${perfil.nombre}`}
                                </h2>
                                <Link to={`/lista/${wishlist.idlista}`} className="text-xs text-dark-muted hover:text-terra transition-colors">
                                    Ver todo
                                </Link>
                            </div>
                            <div className="flex gap-5 overflow-x-auto pb-2">
                                {(wishlist.libros || []).slice(0, 8).map((libro) => (
                                    <LibroCard key={libro.idlibro} libro={libro} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Listas */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-dark-text">Listas</h2>
                            {esMio && (
                                <Link to="/crear-lista" className="text-xs text-dark-muted hover:text-terra transition-colors">
                                    + Nueva lista
                                </Link>
                            )}
                        </div>
                        {listasPublicas.length === 0 ? (
                            <div className="text-center py-8 bg-dark-card rounded-2xl">
                                <p className="text-dark-muted text-sm">
                                    {esMio ? 'No tienes listas todavía' : 'No tiene listas públicas'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {listasPublicas.map((lista) => (
                                    <Link key={lista.idlista} to={`/lista/${lista.idlista}`}
                                          className="bg-dark-card rounded-xl p-4 hover:bg-dark-elevated transition-colors">
                                        <p className="text-terra font-medium">{lista.nombre}</p>
                                        {lista.descripcion && <p className="text-dark-muted text-sm mt-1 line-clamp-1">{lista.descripcion}</p>}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}