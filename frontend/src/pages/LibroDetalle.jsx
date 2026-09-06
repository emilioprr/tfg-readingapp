import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import api from '../api/axios'

export default function LibroDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [libro, setLibro] = useState(null)
    const [resenas, setResenas] = useState([])
    const [estadoLibro, setEstadoLibro] = useState(null)
    const [esFavorito, setEsFavorito] = useState(false)
    const [numFavoritos, setNumFavoritos] = useState(0)
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [listas, setListas] = useState([])
    const [mostrarListas, setMostrarListas] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarLibro()
        cargarResenas()
        cargarEstado()
        cargarFavoritos()
        cargarListas()
    }, [id, usuario])

    const cargarLibro = async () => {
        try { const res = await api.get(`/libros/${id}`); setLibro(res.data) }
        catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const cargarResenas = async () => {
        try { const res = await api.get(`/resenas/libro/${id}?size=10`); setResenas(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }

    const cargarEstado = async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/libro/${id}`)
            const datos = res.data || []
            if (datos.length > 0) setEstadoLibro(datos[datos.length - 1].estado)
        } catch (err) { console.error('Error:', err) }
    }

    const cargarFavoritos = async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/libros/favoritos/${usuario.id}`)
            const favs = res.data || []
            setNumFavoritos(favs.length)
            setEsFavorito(favs.some(f => f.idlibro === parseInt(id)))
        } catch (err) { console.error('Error:', err) }
    }

    const cargarListas = async () => {
        if (!usuario) return
        try { const res = await api.get(`/listas/usuario/${usuario.id}`); setListas(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }

    const toggleFavorito = async () => {
        try {
            if (esFavorito) {
                await api.delete(`/libros/${id}/favorito/${usuario.id}`)
                setEsFavorito(false)
                setNumFavoritos(prev => prev - 1)
            } else {
                if (numFavoritos >= 5) {
                    alert('Ya tienes 5 libros favoritos. Quita uno para añadir otro.')
                    return
                }
                await api.post(`/libros/${id}/favorito/${usuario.id}`)
                setEsFavorito(true)
                setNumFavoritos(prev => prev + 1)
            }
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    const marcarLeyendo = async () => {
        try {
            await api.post('/seguimientos', { estado: 'LEYENDO', idusuario: usuario.id, idlibro: parseInt(id) })
            setEstadoLibro('LEYENDO')
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    const agregarALista = async (idlista) => {
        try {
            await api.post(`/listas/${idlista}/libros/${id}`)
            setMostrarListas(false)
            setMenuAbierto(false)
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    const agregarAWishlist = async () => {
        const wishlist = listas.find(l => l.esAutomatica && l.nombre === 'Wishlist')
        if (wishlist) agregarALista(wishlist.idlista)
        else alert('No se encontró tu wishlist')
        setMenuAbierto(false)
    }

    const getColorNota = (nota) => {
        if (nota < 2) return '#ef4444'
        if (nota < 4) return '#f97316'
        if (nota < 5) return '#ca8a04'
        if (nota < 6) return '#eab308'
        if (nota < 7) return '#84cc16'
        if (nota < 8) return '#22c55e'
        if (nota < 9) return '#c45d3e'
        return '#a855f7'
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!libro) return <p className="text-red-400">Libro no encontrado</p>

    const listasNormales = listas.filter(l => !l.esAutomatica)
    const dist = libro.distribucionNotas || {}
    const distKeys = ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0']
    const maxDist = Math.max(...distKeys.map(k => dist[k] || 0), 1)

    return (
        <div className="max-w-5xl mx-auto">
            {/* Cabecera: Portada + Info + Acciones */}
            <div className="flex flex-col md:flex-row gap-8 mb-10">
                {/* Portada */}
                <div className="flex-shrink-0 relative">
                    {libro.notaMedia && (
                        <div className="absolute -top-3 -left-3 z-10 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-lg"
                             style={{ backgroundColor: getColorNota(libro.notaMedia) }}>
                            {libro.notaMedia}
                        </div>
                    )}
                    {libro.portada ? (
                        <img src={libro.portada} alt={libro.titulo} className="w-52 h-80 object-cover rounded-sm shadow-xl" />
                    ) : (
                        <div className="w-52 h-80 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted shadow-xl">
                            Sin portada
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1">
                    {/* Título + acciones arriba a la derecha */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                            <h1 className="text-3xl font-bold text-dark-text tracking-tight mb-1">{libro.titulo}</h1>
                            <Link to={`/autor/${libro.idautor}`} className="text-dark-muted hover:text-terra text-lg transition-colors">
                                {libro.nombreAutor}
                            </Link>
                            <div className="flex gap-3 mt-2 text-sm text-dark-muted">
                                {libro.genero && <span className="bg-dark-elevated px-2.5 py-0.5 rounded">{libro.genero}</span>}
                                {libro.anioPublicacion && <span>{libro.anioPublicacion}</span>}
                                {libro.numPaginas && <span>{libro.numPaginas} pág.</span>}
                            </div>
                        </div>

                        {/* Iconos arriba a la derecha */}
                        {usuario && (
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {/* Favorito */}
                                <button onClick={toggleFavorito} title={esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                        className="transition-colors">
                                    {esFavorito ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-dark-muted hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    )}
                                </button>

                                {/* Compartir / Recomendar */}
                                <button onClick={() => navigate(`/libro/${id}/recomendar`)} title="Recomendar"
                                        className="text-dark-muted hover:text-terra transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </button>

                                {/* Tres puntos */}
                                <div className="relative">
                                    <button onClick={() => setMenuAbierto(!menuAbierto)} title="Más opciones"
                                            className="text-dark-muted hover:text-dark-text transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                                        </svg>
                                    </button>
                                    {menuAbierto && (
                                        <div className="absolute right-0 top-8 bg-dark-elevated border border-dark-border rounded-xl shadow-2xl w-48 overflow-hidden z-50">
                                            <button onClick={agregarAWishlist}
                                                    className="w-full text-left px-4 py-2.5 text-dark-text hover:bg-dark-card text-sm transition-colors flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                </svg>
                                                Añadir a Wishlist
                                            </button>
                                            {listasNormales.length > 0 ? (
                                                listasNormales.map((lista) => (
                                                    <button key={lista.idlista} onClick={() => agregarALista(lista.idlista)}
                                                            className="w-full text-left px-4 py-2.5 text-dark-text hover:bg-dark-card text-sm transition-colors flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        {lista.nombre}
                                                    </button>
                                                ))
                                            ) : (
                                                <Link to="/crear-lista" onClick={() => setMenuAbierto(false)}
                                                      className="w-full text-left px-4 py-2.5 text-dark-muted hover:bg-dark-card text-sm transition-colors flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Crear lista
                                                </Link>
                                            )}
                                            {estadoLibro === 'LEYENDO' && (
                                                <button onClick={() => navigate('/')}
                                                        className="w-full text-left px-4 py-2.5 text-terra hover:bg-dark-card text-sm transition-colors flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Actualizar progreso
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sinopsis */}
                    {libro.sinopsis && (
                        <p className="text-dark-text/80 mt-4 leading-relaxed text-sm">{libro.sinopsis}</p>
                    )}
                    {usuario && estadoLibro !== 'LEYENDO' && (
                        <button onClick={() => setMostrarConfirmacion(true)}
                                className="mt-5 bg-terra hover:bg-terra-hover text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors">
                            Empezar a leer
                        </button>
                    )}
                </div>
            </div>

            {/* Estadísticas de reseñas */}
            {libro.numResenas > 0 && (
                <div className="bg-dark-card rounded-2xl p-6 mb-10">
                    <div className="flex gap-10">
                        {/* Distribución de notas — barras */}
                        <div className="flex-1 max-w-sm">
                            <h3 className="text-sm font-medium text-dark-muted mb-3">Distribución</h3>
                            <div className="space-y-1">
                                {[...distKeys].reverse().map((star) => {
                                    const count = dist[star] || 0
                                    const pct = maxDist > 0 ? (count / maxDist) * 100 : 0
                                    return (
                                        <div key={star} className="flex items-center gap-2 group">
                                            <span className="text-xs text-dark-muted w-6 text-right">{star}</span>
                                            <div className="flex-1 h-3">
                                                {pct > 0 && (
                                                    <div className="h-full bg-terra rounded-sm transition-all"
                                                         style={{ width: `${pct}%` }} />
                                                )}
                                            </div>
                                            <span className="text-xs text-dark-muted w-6 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                            {count}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Nota media + estrellas */}
                        <div className="flex flex-col items-center justify-center px-6 border-l border-dark-border">
                            <span className="text-4xl font-bold text-dark-text mb-1">{libro.notaMedia}</span>
                            <span className="text-dark-muted text-xs mb-2">de 10</span>
                            <Estrellas puntuacion={libro.notaMedia / 2} />
                            <span className="text-dark-muted text-xs mt-2">{libro.numResenas} reseñas</span>
                        </div>

                        {/* Ritmo medio */}
                        {libro.ritmoMedio && (
                            <div className="flex flex-col items-center justify-center px-6 border-l border-dark-border">
                                <span className="text-sm text-dark-muted mb-2">Ritmo</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map((r) => (
                                        <span key={r} className={`text-xl transition-opacity ${
                                            libro.ritmoMedio >= r ? 'opacity-100' : 'opacity-25'
                                        }`}>⚡</span>
                                    ))}
                                </div>
                                <span className="text-dark-muted text-xs mt-2">
                  {libro.ritmoMedio <= 1.5 ? 'Lento' : libro.ritmoMedio <= 2.5 ? 'Medio' : 'Rápido'}
                </span>
                            </div>
                        )}
                    </div>

                    {/* Etiquetas populares */}
                    {libro.etiquetasPopulares && libro.etiquetasPopulares.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-dark-border">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-dark-muted">Ambiente:</span>
                                <div className="flex gap-2 flex-wrap">
                                    {libro.etiquetasPopulares.map((et) => (
                                        <span key={et} className="text-xs bg-terra/10 text-terra px-2.5 py-1 rounded-full">{et}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Reseñas */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold text-dark-text mb-5">Reseñas</h2>
                {resenas.length === 0 ? (
                    <div className="text-center py-8 bg-dark-card rounded-2xl">
                        <p className="text-dark-muted">Aún no hay reseñas para este libro</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {resenas.map((r) => (
                            <div key={r.idresena} className="bg-dark-card p-5 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {r.avatarUsuario ? (
                                            <img src={r.avatarUsuario} alt={r.nombreUsuario} className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 bg-terra/20 rounded-full flex items-center justify-center text-terra text-xs font-bold">
                                                {r.nombreUsuario?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <Link to={`/usuario/${r.idusuario}`} className="text-dark-text text-sm font-medium hover:text-terra transition-colors">
                                            {r.nombreUsuario}
                                        </Link>
                                        <span className="text-dark-muted text-xs">{new Date(r.fechaCreacion).toLocaleDateString()}</span>
                                    </div>
                                    <Estrellas puntuacion={r.puntuacion} />
                                </div>
                                {r.tieneSpoiler ? (
                                    <p className="text-dark-muted italic text-sm">Contiene spoilers</p>
                                ) : r.texto && (
                                    <p className="text-dark-text/80 text-sm">{r.texto}</p>
                                )}
                                {r.etiquetas?.length > 0 && (
                                    <div className="flex gap-1.5 mt-3 flex-wrap">
                                        {r.etiquetas.map((et) => (
                                            <span key={et} className="text-xs bg-terra/10 text-terra px-2 py-0.5 rounded-full">{et}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal confirmación empezar a leer */}
            {mostrarConfirmacion && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-dark-text mb-2">¿Empezar a leer?</h3>
                        <p className="text-dark-muted mb-6">{libro.titulo}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setMostrarConfirmacion(false)}
                                    className="px-4 py-2 text-dark-muted hover:text-dark-text transition-colors">Cancelar</button>
                            <button onClick={async () => { await marcarLeyendo(); setMostrarConfirmacion(false) }}
                                    className="bg-terra hover:bg-terra-hover text-white font-semibold px-4 py-2 rounded-lg transition-colors">Sí, empezar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}