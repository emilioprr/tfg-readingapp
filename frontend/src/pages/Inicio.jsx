import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LibroCard from '../components/LibroCard'
import ResenaCard from '../components/ResenaCard'
import api from '../api/axios'

export default function Inicio() {
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [leyendo, setLeyendo] = useState([])
    const [leyendoIndex, setLeyendoIndex] = useState(0)
    const [retosActivos, setRetosActivos] = useState([])
    const [retoIndex, setRetoIndex] = useState(0)
    const [resenasSeguidos, setResenasSeguidos] = useState([])
    const [popularesAmigos, setPopularesAmigos] = useState([])
    const [loading, setLoading] = useState(true)

    const [editandoProgreso, setEditandoProgreso] = useState(false)
    const [nuevaPagina, setNuevaPagina] = useState('')
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [errorProgreso, setErrorProgreso] = useState('')
    const [mostrarFinalizarModal, setMostrarFinalizarModal] = useState(false)

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
            const datos = res.data || []
            datos.sort((a, b) => b.idseguimiento - a.idseguimiento)
            setLeyendo(datos)
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

    const actualizarProgreso = async () => {
        if (!nuevaPagina) return
        setErrorProgreso('')
        const libroActual = leyendo[leyendoIndex]
        try {
            await api.post('/seguimientos', {
                estado: 'LEYENDO',
                idusuario: usuario.id,
                idlibro: libroActual.idlibro,
                numPagina: parseInt(nuevaPagina),
            })
            setEditandoProgreso(false)
            setNuevaPagina('')

            if (libroActual.totalPaginas && parseInt(nuevaPagina) >= libroActual.totalPaginas) {
                await api.post('/seguimientos', {
                    estado: 'LEIDO',
                    idusuario: usuario.id,
                    idlibro: libroActual.idlibro,
                })
                cargarRetos()
                navigate(`/libro/${libroActual.idlibro}/resena`)
            } else {
                cargarLeyendo()
                cargarRetos()
            }
        } catch (err) {
            setErrorProgreso(err.response?.data?.mensaje || 'Error al actualizar')
        }
    }

    const marcarComoLeido = async () => {
        const libroActual = leyendo[leyendoIndex]
        try {
            await api.post('/seguimientos', {
                estado: 'LEIDO',
                idusuario: usuario.id,
                idlibro: libroActual.idlibro,
            })
            setMenuAbierto(false)
            navigate(`/libro/${libroActual.idlibro}/resena`)
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error')
        }
    }

    const marcarComoAbandonado = async () => {
        const libroActual = leyendo[leyendoIndex]
        try {
            await api.post('/seguimientos', {
                estado: 'ABANDONADO',
                idusuario: usuario.id,
                idlibro: libroActual.idlibro,
            })
            setMenuAbierto(false)
            if (leyendoIndex >= leyendo.length - 1) setLeyendoIndex(Math.max(0, leyendoIndex - 1))
            cargarLeyendo()
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error')
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') actualizarProgreso()
        if (e.key === 'Escape') { setEditandoProgreso(false); setNuevaPagina(''); setErrorProgreso('') }
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

            {/* Grid principal */}
            <div className="flex gap-5 mb-12">
                {/* Leyendo ahora — 3/4 */}
                <div className="flex-[3] bg-dark-card rounded-2xl p-6 min-h-[280px]">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-dark-text">Leyendo ahora</h2>
                        {leyendo.length > 1 && (
                            <span className="text-xs text-dark-muted">{leyendo.length} libros</span>
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
                            <div className="flex gap-6 relative">
                                <Link to={`/libro/${libroActual.idlibro}`} className="flex-shrink-0">
                                    {libroActual.portadaLibro ? (
                                        <img src={libroActual.portadaLibro} alt={libroActual.tituloLibro}
                                             className="w-32 h-48 object-cover shadow-lg rounded-sm" />
                                    ) : (
                                        <div className="w-32 h-48 bg-dark-elevated flex items-center justify-center text-dark-muted text-sm shadow-lg rounded-sm">
                                            Sin portada
                                        </div>
                                    )}
                                </Link>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <Link to={`/libro/${libroActual.idlibro}`}
                                                      className="text-xl font-bold text-dark-text hover:text-terra transition-colors block mb-1">
                                                    {libroActual.tituloLibro}
                                                </Link>
                                                <p className="text-dark-muted text-sm">{libroActual.nombreAutor || ''}</p>
                                            </div>

                                            <Link to={`/libro/${libroActual.idlibro}/anotaciones`}
                                                  className="text-dark-muted hover:text-terra transition-colors p-1" title="Nueva anotación">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                </svg>
                                            </Link>

                                            <div className="relative">
                                                <button onClick={() => setMenuAbierto(!menuAbierto)}
                                                        className="text-dark-muted hover:text-dark-text transition-colors p-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                                                    </svg>
                                                </button>
                                                {menuAbierto && (
                                                    <div className="absolute right-0 top-8 bg-dark-elevated border border-dark-border rounded-xl shadow-2xl w-44 overflow-hidden z-50">
                                                        <button onClick={() => { setMenuAbierto(false); setMostrarFinalizarModal(true) }}
                                                                className="w-full text-left px-4 py-2.5 text-dark-text hover:bg-dark-card text-sm transition-colors flex items-center gap-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Finalizado
                                                        </button>
                                                        <button onClick={marcarComoAbandonado}
                                                                className="w-full text-left px-4 py-2.5 text-dark-text hover:bg-dark-card text-sm transition-colors flex items-center gap-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            Abandonar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 mb-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-dark-muted text-xs">Progreso</span>
                                                <span className="text-terra font-bold text-sm">{libroActual.porcentaje || 0}%</span>
                                            </div>
                                            <div className="bg-dark-border rounded-full h-2.5 w-full">
                                                <div className="bg-terra h-2.5 rounded-full transition-all duration-500"
                                                     style={{ width: `${libroActual.porcentaje || 0}%` }} />
                                            </div>
                                        </div>

                                        {editandoProgreso ? (
                                            <div className="flex items-center gap-2 mt-3">
                                                <span className="text-dark-muted text-sm">Página</span>
                                                <input
                                                    type="number"
                                                    value={nuevaPagina}
                                                    onChange={(e) => setNuevaPagina(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    autoFocus
                                                    min={libroActual.numPagina + 1}
                                                    max={libroActual.totalPaginas || undefined}
                                                    className="w-20 bg-dark-elevated border border-dark-border rounded-lg px-2 py-1 text-dark-text text-sm focus:border-terra focus:outline-none transition-colors"
                                                />
                                                <span className="text-dark-muted text-sm">de {libroActual.totalPaginas || '?'}</span>
                                                <button onClick={actualizarProgreso}
                                                        className="bg-terra hover:bg-terra-hover text-white font-semibold px-3 py-1 rounded-lg text-sm transition-colors">
                                                    OK
                                                </button>
                                                <button onClick={() => { setEditandoProgreso(false); setNuevaPagina(''); setErrorProgreso('') }}
                                                        className="text-dark-muted hover:text-dark-text text-sm transition-colors">
                                                    ✕
                                                </button>
                                                {errorProgreso && <p className="text-red-400 text-xs mt-1">{errorProgreso}</p>}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between mt-3">
                                                    <span className="text-dark-muted text-sm">
                                                      Pág. {libroActual.numPagina}{libroActual.totalPaginas ? ` de ${libroActual.totalPaginas}` : ''}
                                                    </span>
                                                <button onClick={() => { setEditandoProgreso(true); setNuevaPagina(String(libroActual.numPagina + 1)) }}
                                                        className="bg-terra hover:bg-terra-hover text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors">
                                                    Actualizar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {leyendo.length > 1 && (
                                <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-dark-border">
                                    <button onClick={() => { setLeyendoIndex(i => i === 0 ? leyendo.length - 1 : i - 1); setEditandoProgreso(false); setMenuAbierto(false) }}
                                            className="text-dark-muted hover:text-terra transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="flex gap-1.5">
                                        {leyendo.map((_, i) => (
                                            <button key={i} onClick={() => { setLeyendoIndex(i); setEditandoProgreso(false); setMenuAbierto(false) }}
                                                    className={`w-2 h-2 rounded-full transition-colors ${i === leyendoIndex ? 'bg-terra' : 'bg-dark-border hover:bg-dark-muted'}`} />
                                        ))}
                                    </div>
                                    <button onClick={() => { setLeyendoIndex(i => i === leyendo.length - 1 ? 0 : i + 1); setEditandoProgreso(false); setMenuAbierto(false) }}
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
                                            <span className="text-dark-muted text-xs">
                                                {retoActual.progreso}/{retoActual.meta}{(retoActual.tipoReto || retoActual.tipo) === 'HORAS' ? ' min' : ''}
                                            </span>
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
                    <div className="flex gap-5 overflow-x-auto pb-2">
                        {popularesAmigos.map((libro) => (
                            <LibroCard key={libro.idlibro} libro={libro} />
                        ))}
                    </div>
                </div>
            )}

            {/* Nuevas reseñas de amigos */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold text-dark-text mb-5">Nuevas reseñas de amigos</h2>

                {resenasSeguidos.length === 0 ? (
                    <div className="text-center py-10 bg-dark-card rounded-2xl">
                        <p className="text-dark-muted mb-2">Tus amigos aún no han reseñado libros</p>
                        <Link to="/buscar" className="text-terra hover:text-terra-hover text-sm transition-colors">
                            Buscar lectores para seguir
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resenasSeguidos.map((resena) => (
                            <ResenaCard key={resena.idresena} resena={resena} />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal finalizar */}
            {mostrarFinalizarModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-dark-text mb-2">¿Marcar como finalizado?</h3>
                        <p className="text-dark-muted mb-6">{leyendo[leyendoIndex]?.tituloLibro}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setMostrarFinalizarModal(false)}
                                    className="px-4 py-2 text-dark-muted hover:text-dark-text transition-colors">
                                Cancelar
                            </button>
                            <button onClick={async () => { setMostrarFinalizarModal(false); await marcarComoLeido() }}
                                    className="bg-terra hover:bg-terra-hover text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                                Sí, finalizar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}