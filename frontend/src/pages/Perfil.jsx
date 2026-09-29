import { useState, useEffect, useCallback } from 'react'
import {useParams, Link, useSearchParams} from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ResenaCard from '../components/ResenaCard'
import ListaCard from '../components/ListaCard'
import api from '../api/axios'
import SpoilerOculto from '../components/SpoilerOculto'

/** Formato corto para contadores: 950 → 950, 1.234 → 1,2K, 1.500.000 → 1,5M.
 *  Se trunca (no redondea) para no mostrar más de lo que hay, p. ej. 999.999 → 999,9K. */
const formatoCorto = (n) => {
    if (n == null) return 0
    const corto = (valor, sufijo) =>
        (Math.floor(valor * 10) / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + sufijo
    if (n >= 1_000_000) return corto(n / 1_000_000, 'M')
    if (n >= 1_000) return corto(n / 1_000, 'K')
    return n
}

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
    const [listasPublicas, setListasPublicas] = useState([])
    const [searchParams] = useSearchParams()
    const [tab, setTab] = useState(searchParams.get('tab') || 'libros')
    const [leyendoLibros, setLeyendoLibros] = useState([])
    const [leidosLibros, setLeidosLibros] = useState([])
    const [pendientesLibros, setPendientesLibros] = useState([])
    const [abandonadosLibros, setAbandonadosLibros] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [leyendoIndex, setLeyendoIndex] = useState(0)


    const cargarPerfil = useCallback(async () => {
        try { const res = await api.get(`/usuarios/${perfilId}`); setPerfil(res.data) }
        catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }, [perfilId])

    const cargarFavoritos = useCallback(async () => {
        try {
            const res = await api.get(`/libros/favoritos/${perfilId}`)
            const datos = res.data || []
            datos.sort((a, b) => a.idlibro - b.idlibro)
            setFavoritos(datos)
        } catch (err) { console.error('Error:', err) }
    }, [perfilId])

    const cargarLecturasRecientes = useCallback(async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${perfilId}/estado/LEIDO`)
            setLecturasRecientes(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [perfilId])

    const cargarResenas = useCallback(async () => {
        try {
            const endpoint = esMio
                ? `/resenas/usuario/${perfilId}?size=20`
                : `/resenas/usuario/${perfilId}/publicas?size=20`
            const res = await api.get(endpoint)
            const datos = res.data.content || res.data || []
            datos.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
            setResenas(datos)
        } catch (err) { console.error('Error:', err) }
    }, [esMio, perfilId])

    const cargarAnotaciones = useCallback(async () => {
        try {
            const res = await api.get(`/anotaciones/usuario/${perfilId}`)
            setAnotaciones(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [perfilId])

    const cargarListasPublicas = useCallback(async () => {
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
    }, [perfilId, usuario])

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

    const comprobarSiguiendo = useCallback(async () => {
        if (!usuario || esMio) return
        try {
            const res = await api.get(`/usuarios/${usuario.id}/seguidos`)
            const seguidos = res.data || []
            setSiguiendo(seguidos.some(u => u.idusuario === perfilId))
        } catch (err) { console.error('Error:', err) }
    }, [esMio, perfilId, usuario])

    const cargarLeyendoLibros = useCallback(async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${perfilId}/estado/LEYENDO`)
            setLeyendoLibros(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [perfilId])

    const cargarLeidosLibros = useCallback(async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${perfilId}/estado/LEIDO`)
            setLeidosLibros(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [perfilId])

    const cargarPendientesLibros = useCallback(async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${perfilId}/estado/PENDIENTE`)
            setPendientesLibros(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [perfilId])

    const cargarAbandonadosLibros = useCallback(async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${perfilId}/estado/ABANDONADO`)
            setAbandonadosLibros(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [perfilId])

    const cargarEstadisticas = useCallback(async () => {
        try { const res = await api.get(`/usuarios/${perfilId}/perfil`); setEstadisticas(res.data) }
        catch (err) { console.error('Error:', err) }
    }, [perfilId])

    useEffect(() => {
        if (perfilId) {
            cargarPerfil()
            cargarEstadisticas()
            setLeyendoIndex(0)
            cargarFavoritos()
            cargarLecturasRecientes()
            cargarResenas()
            cargarAnotaciones()
            cargarLeyendoLibros()
            cargarLeidosLibros()
            cargarPendientesLibros()
            cargarAbandonadosLibros()
            cargarListasPublicas()
            comprobarSiguiendo()
        }
    }, [cargarAbandonadosLibros, cargarAnotaciones, cargarEstadisticas, cargarFavoritos, cargarLecturasRecientes, cargarLeidosLibros, cargarLeyendoLibros, cargarListasPublicas, cargarPendientesLibros, cargarPerfil, cargarResenas, comprobarSiguiendo, perfilId])

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!perfil) return <p className="text-red-400">Usuario no encontrado</p>

    const libroLeyendo = leyendoLibros[leyendoIndex] ?? leyendoLibros[0]
    const favoritosSlots = [...favoritos.slice(0, 5)]
    while (favoritosSlots.length < 5) favoritosSlots.push(null)

    const tabs = [
        { key: 'libros', label: 'Libros' },
        { key: 'estanteria', label: 'Estantería' },
        { key: 'resenas', label: 'Reseñas' },
        { key: 'anotaciones', label: 'Anotaciones' },
        { key: 'listas', label: 'Listas' },
    ]

    return (
        <div className="max-w-4xl mx-auto">

            {/* Header: foto y texto a la izquierda; estadísticas y lectura actual a la derecha */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
                <div className="flex items-start gap-5 min-w-0">
                    {perfil.avatar ? (
                        <img src={perfil.avatar} alt={perfil.nombre}
                             className="w-24 h-24 rounded-full object-cover ring-4 ring-dark-border flex-shrink-0" />
                    ) : (
                        <div className="w-24 h-24 bg-terra/20 rounded-full flex items-center justify-center text-terra text-4xl font-bold ring-4 ring-dark-border flex-shrink-0">
                            {perfil.nombre?.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-dark-text tracking-tight">{perfil.nombre}</h1>

                        {perfil.biografia ? (
                            <p className="text-dark-muted text-sm leading-relaxed mt-1.5 max-w-md">{perfil.biografia}</p>
                        ) : (
                            <p className="text-dark-muted/50 text-sm mt-1.5 italic">Sin biografía</p>
                        )}

                        <div className="mt-3">
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
                </div>

                <div className="md:w-72 flex-shrink-0 flex flex-col gap-3">
                    {/* Estadísticas */}
                    {estadisticas && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {[
                                { valor: estadisticas.librosLeidos, label: 'libros leídos' },
                                { valor: estadisticas.paginasLeidas, label: 'páginas' },
                                { valor: estadisticas.resenasEscritas, label: 'reseñas' },
                            ].map((e) => (
                                <p key={e.label} className="text-dark-muted text-sm" title={e.valor?.toLocaleString('es-ES')}>
                                    <span className="text-dark-text font-bold mr-1">{formatoCorto(e.valor)}</span>
                                    {e.label}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Leyendo ahora (carrusel compacto) */}
                    <div className="bg-dark-card rounded-xl px-3 py-2.5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-dark-muted">Leyendo ahora</span>
                            {leyendoLibros.length > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => setLeyendoIndex(i => i === 0 ? leyendoLibros.length - 1 : i - 1)}
                                            className="text-dark-muted hover:text-terra transition-colors" title="Anterior">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    {leyendoLibros.map((_, i) => (
                                        <button key={i} onClick={() => setLeyendoIndex(i)}
                                                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === leyendoIndex ? 'bg-terra' : 'bg-dark-border hover:bg-dark-muted'}`} />
                                    ))}
                                    <button onClick={() => setLeyendoIndex(i => i === leyendoLibros.length - 1 ? 0 : i + 1)}
                                            className="text-dark-muted hover:text-terra transition-colors" title="Siguiente">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {!libroLeyendo ? (
                            <p className="text-dark-muted/70 text-xs">Nada ahora mismo</p>
                        ) : (
                            <Link to={`/libro/${libroLeyendo.idlibro}`} className="group flex items-center gap-3">
                                {libroLeyendo.portadaLibro ? (
                                    <img src={libroLeyendo.portadaLibro} alt={libroLeyendo.tituloLibro}
                                         className="w-8 h-12 object-cover rounded-sm flex-shrink-0" />
                                ) : (
                                    <div className="w-8 h-12 bg-dark-elevated rounded-sm flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-dark-text text-sm truncate group-hover:text-terra transition-colors">{libroLeyendo.tituloLibro}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="bg-dark-border rounded-full h-1 flex-1">
                                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-1 rounded-full"
                                                 style={{ width: `${libroLeyendo.porcentaje || 0}%` }} />
                                        </div>
                                        <span className="text-dark-muted text-xs">{libroLeyendo.porcentaje || 0}%</span>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
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

            {tab === 'estanteria' && (
                <>
                    {/* Quiero leer */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-dark-text">Quiero leer</h2>
                            {pendientesLibros.length > 6 && (
                                <Link to={`/estanteria/${perfilId}/PENDIENTE`} className="text-xs text-dark-muted hover:text-terra transition-colors">
                                    Ver todo ({pendientesLibros.length})
                                </Link>
                            )}
                        </div>
                        {pendientesLibros.length === 0 ? (
                            <p className="text-dark-muted text-sm">No hay libros pendientes</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-6">
                                {pendientesLibros.slice(0, 6).map((s) => (
                                    <Link key={s.idseguimiento} to={`/libro/${s.idlibro}`} className="group">
                                        {s.portadaLibro ? (
                                            <img src={s.portadaLibro} alt={s.tituloLibro}
                                                 className="w-full h-56 object-cover rounded-sm shadow-md group-hover:shadow-xl transition-shadow" />
                                        ) : (
                                            <div className="w-full h-56 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted text-sm shadow-md">
                                                Sin portada
                                            </div>
                                        )}
                                        <p className="text-xs text-dark-text truncate mt-2 group-hover:text-terra transition-colors">{s.tituloLibro}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Leyendo */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-dark-text">Leyendo</h2>
                            {leyendoLibros.length > 6 && (
                                <Link to={`/estanteria/${perfilId}/LEYENDO`} className="text-xs text-dark-muted hover:text-terra transition-colors">
                                    Ver todo ({leyendoLibros.length})
                                </Link>
                            )}
                        </div>
                        {leyendoLibros.length === 0 ? (
                            <p className="text-dark-muted text-sm">No hay libros en lectura</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-6">
                                {leyendoLibros.slice(0, 6).map((s) => (
                                    <Link key={s.idseguimiento} to={`/libro/${s.idlibro}`} className="group">
                                        {s.portadaLibro ? (
                                            <img src={s.portadaLibro} alt={s.tituloLibro}
                                                 className="w-full h-56 object-cover rounded-sm shadow-md group-hover:shadow-xl transition-shadow" />
                                        ) : (
                                            <div className="w-full h-56 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted text-sm shadow-md">
                                                Sin portada
                                            </div>
                                        )}
                                        <p className="text-xs text-dark-text truncate mt-2 group-hover:text-terra transition-colors">{s.tituloLibro}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Leídos */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-dark-text">Leídos</h2>
                            {leidosLibros.length > 6 && (
                                <Link to={`/estanteria/${perfilId}/LEIDO`} className="text-xs text-dark-muted hover:text-terra transition-colors">
                                    Ver todo ({leidosLibros.length})
                                </Link>
                            )}
                        </div>
                        {leidosLibros.length === 0 ? (
                            <p className="text-dark-muted text-sm">No hay libros leídos</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-6">
                                {leidosLibros.slice(0, 6).map((s) => (
                                    <Link key={s.idseguimiento} to={`/libro/${s.idlibro}`} className="group">
                                        {s.portadaLibro ? (
                                            <img src={s.portadaLibro} alt={s.tituloLibro}
                                                 className="w-full h-56 object-cover rounded-sm shadow-md group-hover:shadow-xl transition-shadow" />
                                        ) : (
                                            <div className="w-full h-56 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted text-sm shadow-md">
                                                Sin portada
                                            </div>
                                        )}
                                        <p className="text-xs text-dark-text truncate mt-2 group-hover:text-terra transition-colors">{s.tituloLibro}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Abandonados */}
                    {abandonadosLibros.length > 0 && (
                        <div className="mb-10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-dark-text">Abandonados</h2>
                                {abandonadosLibros.length > 6 && (
                                    <Link to={`/estanteria/${perfilId}/ABANDONADO`} className="text-xs text-dark-muted hover:text-terra transition-colors">
                                        Ver todo ({abandonadosLibros.length})
                                    </Link>
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-6">
                                {abandonadosLibros.slice(0, 6).map((s) => (
                                    <Link key={s.idseguimiento} to={`/libro/${s.idlibro}`} className="group">
                                        {s.portadaLibro ? (
                                            <img src={s.portadaLibro} alt={s.tituloLibro}
                                                 className="w-full h-56 object-cover rounded-sm shadow-md group-hover:shadow-xl transition-shadow" />
                                        ) : (
                                            <div className="w-full h-56 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted text-sm shadow-md">
                                                Sin portada
                                            </div>
                                        )}
                                        <p className="text-xs text-dark-text truncate mt-2 group-hover:text-terra transition-colors">{s.tituloLibro}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </>
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
                                        <SpoilerOculto activo={a.tieneSpoiler && usuario?.id !== a.idusuario}>
                                            <div>
                                                {a.titulo && <p className="text-dark-text font-medium text-sm mb-1">{a.titulo}</p>}
                                                <p className="text-dark-text/70 text-sm">{a.texto}</p>
                                            </div>
                                        </SpoilerOculto>
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

                    {/* Listas */}
                    <div className="space-y-4">
                        {listasPublicas.map((lista) => (
                            <ListaCard key={lista.idlista} lista={lista} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}