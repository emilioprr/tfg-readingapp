import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import ResenaCard from '../components/ResenaCard'
import api from '../api/axios'
import SpoilerOculto from '../components/SpoilerOculto'
import PuntuarLibro from '../components/PuntuarLibro'
import GuardarEnListaModal from '../components/GuardarEnListaModal'

export default function LibroDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [libro, setLibro] = useState(null)
    const [resenas, setResenas] = useState([])
    const [estadoLibro, setEstadoLibro] = useState(null)
    const [lecturaAntigua, setLecturaAntigua] = useState(false)
    const [esFavorito, setEsFavorito] = useState(false)
    const [numFavoritos, setNumFavoritos] = useState(0)
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
    const [mostrarListas, setMostrarListas] = useState(false)
    const [loading, setLoading] = useState(true)
    const [anotacionesPublicas, setAnotacionesPublicas] = useState([])
    const [tabPrincipal, setTabPrincipal] = useState('resenas')
    const [subTabResenas, setSubTabResenas] = useState('todas')
    const [subTabAnotaciones, setSubTabAnotaciones] = useState('todas')
    const [resenasAmigos, setResenasAmigos] = useState([])
    const [misResenas, setMisResenas] = useState([])
    const [anotacionesAmigos, setAnotacionesAmigos] = useState([])
    const [misAnotaciones, setMisAnotaciones] = useState([])
    const [totalResenas, setTotalResenas] = useState(0)

    const cargarLibro = useCallback(async () => {
        try { const res = await api.get(`/libros/${id}`); setLibro(res.data) }
        catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }, [id])

    const cargarResenas = useCallback(async () => {
        try {
            const res = await api.get(`/resenas/libro/${id}?size=5`)
            setResenas(res.data.content || res.data || [])
            setTotalResenas(res.data.totalElements || res.data.length || 0)
        } catch (err) { console.error('Error:', err) }
    }, [id])

    const cargarEstado = useCallback(async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/libro/${id}`)
            const datos = res.data || []
            const ultimo = datos.length > 0 ? datos[datos.length - 1] : null
            setEstadoLibro(ultimo ? ultimo.estado : null)
            setLecturaAntigua(!!ultimo?.lecturaAntigua)
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    const cargarFavoritos = useCallback(async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/libros/favoritos/${usuario.id}`)
            const favs = res.data || []
            setNumFavoritos(favs.length)
            setEsFavorito(favs.some(f => f.idlibro === parseInt(id)))
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    const cargarAnotaciones = useCallback(async () => {
        try {
            const res = await api.get(`/anotaciones/libro/${id}/publicas`)
            setAnotacionesPublicas(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [id])

    const cargarResenasAmigos = useCallback(async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/resenas/libro/${id}?size=50`)
            const todas = res.data.content || res.data || []
            const segRes = await api.get(`/usuarios/${usuario.id}/seguidos`)
            const seguidos = (segRes.data || []).map(u => u.idusuario)
            setResenasAmigos(todas.filter(r => seguidos.includes(r.idusuario)))
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    const cargarMisResenas = useCallback(async () => {
        if (!usuario) return
        try {
            // Tus reseñas (también las privadas), no solo las públicas del libro
            const res = await api.get(`/resenas/usuario/${usuario.id}?size=200`)
            const todas = res.data.content || res.data || []
            setMisResenas(todas.filter(r => r.idlibro === parseInt(id)))
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    const cargarAnotacionesAmigos = useCallback(async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/anotaciones/libro/${id}/publicas`)
            const todas = res.data || []
            const segRes = await api.get(`/usuarios/${usuario.id}/seguidos`)
            const seguidos = (segRes.data || []).map(u => u.idusuario)
            setAnotacionesAmigos(todas.filter(a => seguidos.includes(a.idusuario)))
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    const cargarMisAnotaciones = useCallback(async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/anotaciones/usuario/${usuario.id}/libro/${id}`)
            setMisAnotaciones(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    useEffect(() => {
        cargarLibro()
        cargarResenas()
        cargarEstado()
        cargarFavoritos()
        cargarAnotaciones()
        cargarResenasAmigos()
        cargarMisResenas()
        cargarAnotacionesAmigos()
        cargarMisAnotaciones()
    }, [cargarAnotaciones, cargarAnotacionesAmigos, cargarEstado, cargarFavoritos, cargarLibro, cargarMisAnotaciones, cargarMisResenas, cargarResenas, cargarResenasAmigos, id, usuario])

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
        navigate('/')
    }

    const agregarAWishlist = async () => {
        try {
            await api.post('/seguimientos', { estado: 'PENDIENTE', idusuario: usuario.id, idlibro: parseInt(id) })
            setEstadoLibro('PENDIENTE')
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!libro) return <p className="text-red-400">Libro no encontrado</p>

    const dist = libro.distribucionNotas || {}
    const distKeys = ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0']
    const maxDist = Math.max(...distKeys.map(k => dist[k] || 0), 1)
    const notaMedia = libro.notaMedia // sobre 5
    // Tu reseña más reciente de este libro (si lo has releído puede haber varias)
    const miResena = [...misResenas].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))[0]
    const formatoNota = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

    return (
        <div className="max-w-5xl mx-auto">
            {/* Cabecera: Portada + Info + Acciones */}
            <div className="flex flex-col md:flex-row gap-8 mb-10">
                {/* Portada */}
                <div className="flex-shrink-0">
                    {libro.portada ? (
                        <img src={libro.portada} alt={libro.titulo} className="w-52 h-80 object-cover rounded-sm shadow-xl" />
                    ) : (
                        <div className="w-52 h-80 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted shadow-xl">
                            Sin portada
                        </div>
                    )}
                    {usuario && (
                        <PuntuarLibro idlibro={id} estado={estadoLibro} lecturaAntigua={lecturaAntigua} miResena={miResena}
                                      onCambio={() => { cargarLibro(); cargarEstado(); cargarMisResenas(); cargarResenas() }} />
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
                            {usuario && usuario.rol === 'ADMIN' && (
                                <Link to={`/libro/${id}/editar`}
                                      className="text-dark-muted hover:text-terra transition-colors text-sm">
                                    Editar libro
                                </Link>
                            )}
                            <div className="flex gap-3 mt-2 text-sm text-dark-muted">
                                {libro.genero && <span className="bg-dark-elevated px-2.5 py-0.5 rounded">{libro.genero}</span>}
                                {libro.anioPublicacion && <span>{libro.anioPublicacion}</span>}
                                {libro.numPaginas && <span>{libro.numPaginas} pág.</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                {notaMedia != null ? (
                                    <>
                                        <span className="text-terra text-4xl leading-none">★</span>
                                        <span className="text-dark-text text-4xl font-bold leading-none tracking-tight">{formatoNota(notaMedia)}</span>
                                        <span className="text-dark-muted text-sm self-end mb-0.5 ml-1">
                                            {libro.numValoraciones} {libro.numValoraciones === 1 ? 'valoración' : 'valoraciones'}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-dark-muted text-sm">Sin valoraciones todavía</span>
                                )}
                            </div>
                        </div>

                        {/* Iconos arriba a la derecha */}
                        {usuario && (
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {/* Favorito */}
                                <button onClick={toggleFavorito} className="transition-colors" title={esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
                                    {esFavorito ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-dark-muted hover:text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

                                {/* Guardar en lista */}
                                <button onClick={() => setMostrarListas(true)} title="Guardar en lista"
                                        className="text-dark-muted hover:text-terra transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h11M4 12h11M4 18h7m9-3v6m-3-3h6" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sinopsis */}
                    {libro.sinopsis && (
                        <p className="text-dark-text/80 mt-4 leading-relaxed text-sm">{libro.sinopsis}</p>
                    )}
                    {/* Acciones de lectura según el estado del libro */}
                    {usuario && (
                        <div className="flex flex-wrap items-center gap-3 mt-5">
                            {estadoLibro === 'LEYENDO' ? (
                                <button onClick={() => navigate('/')}
                                        className="bg-terra hover:bg-terra-hover text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors">
                                    Actualizar progreso
                                </button>
                            ) : (
                                <button onClick={() => setMostrarConfirmacion(true)}
                                        className="bg-terra hover:bg-terra-hover text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors">
                                    {estadoLibro === 'LEIDO' ? 'Releer' : 'Empezar a leer'}
                                </button>
                            )}
                            {!estadoLibro && (
                                <button onClick={agregarAWishlist}
                                        className="border border-dark-border hover:border-terra hover:text-terra text-dark-text px-5 py-2 rounded-lg text-sm transition-colors">
                                    Quiero leer
                                </button>
                            )}
                            {estadoLibro === 'PENDIENTE' && (
                                <span className="text-dark-muted text-sm">✓ En tu lista de Quiero leer</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Estadísticas de reseñas */}
            {libro.numValoraciones > 0 && (
                <div className="bg-dark-card rounded-2xl p-6 mb-10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x divide-dark-border">
                        {/* Distribución de notas: histograma compacto de 0,5 a 5 estrellas */}
                        <div className="flex flex-col items-center sm:px-6">
                            <h3 className="text-xs uppercase tracking-wide text-dark-muted mb-3">Distribución</h3>
                            <div className="flex items-end gap-1 h-16">
                                {distKeys.map((k) => {
                                    const count = dist[k] || 0
                                    const alto = count > 0 ? Math.max(8, (count / maxDist) * 100) : 4
                                    return (
                                        <div key={k} className="relative h-full flex items-end group">
                                            <div className={`w-3 rounded-sm transition-colors ${count > 0 ? 'bg-terra/80 group-hover:bg-terra' : 'bg-dark-border'}`}
                                                 style={{ height: `${alto}%` }} />
                                            {/* Al pasar el ratón: nº de valoraciones con esa nota, encima de la barra */}
                                            <div className="absolute left-1/2 -translate-x-1/2 mb-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                 style={{ bottom: `${alto}%` }}>
                                                <div className="bg-dark-elevated border border-dark-border text-dark-text text-[11px] rounded-md px-2 py-1 whitespace-nowrap shadow-lg">
                                                    <span className="font-semibold">{count}</span> {count === 1 ? 'valoración' : 'valoraciones'}
                                                    <span className="text-dark-muted"> · {k.replace('.', ',')}★</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex justify-between w-full max-w-[9.5rem] mt-1.5 text-[11px] text-dark-muted">
                                <span>★</span>
                                <span>★★★★★</span>
                            </div>
                        </div>

                        {/* Nota media sobre 5 */}
                        <div className="flex flex-col items-center sm:px-6">
                            <h3 className="text-xs uppercase tracking-wide text-dark-muted mb-2">Valoración media</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-dark-text leading-none">{formatoNota(notaMedia)}</span>
                                <span className="text-dark-muted text-sm">/ 5</span>
                            </div>
                            <div className="mt-2"><Estrellas puntuacion={notaMedia} /></div>
                            <span className="text-dark-muted text-xs mt-1">
                                {libro.numValoraciones} {libro.numValoraciones === 1 ? 'valoración' : 'valoraciones'}
                            </span>
                        </div>

                        {/* Ritmo medio */}
                        <div className="flex flex-col items-center sm:px-6">
                            <h3 className="text-xs uppercase tracking-wide text-dark-muted mb-3">Ritmo</h3>
                            {libro.ritmoMedio ? (
                                <>
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map((r) => (
                                            <span key={r} className={`text-2xl ${libro.ritmoMedio >= r ? 'opacity-100' : 'opacity-25'}`}>⚡</span>
                                        ))}
                                    </div>
                                    <span className="text-dark-muted text-xs mt-2">
                                        {libro.ritmoMedio <= 1.5 ? 'Lento' : libro.ritmoMedio <= 2.5 ? 'Medio' : 'Rápido'}
                                    </span>
                                </>
                            ) : (
                                <span className="text-dark-muted text-xs">Sin datos</span>
                            )}
                        </div>
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

            {/* Tabs principales */}
            <div className="flex gap-4 mb-6 border-b border-dark-border">
                <button onClick={() => setTabPrincipal('resenas')}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                            tabPrincipal === 'resenas' ? 'text-terra' : 'text-dark-muted hover:text-dark-text'
                        }`}>
                    Reseñas
                    {tabPrincipal === 'resenas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terra rounded-full" />}
                </button>
                <button onClick={() => setTabPrincipal('anotaciones')}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                            tabPrincipal === 'anotaciones' ? 'text-terra' : 'text-dark-muted hover:text-dark-text'
                        }`}>
                    Anotaciones
                    {tabPrincipal === 'anotaciones' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terra rounded-full" />}
                </button>
            </div>

            {/* Contenido de Reseñas */}
            {tabPrincipal === 'resenas' && (
                <div className="mb-12">
                    {/* Sub-tabs */}
                    <div className="flex gap-2 mb-5">
                        {[
                            { key: 'todas', label: 'Todas' },
                            ...(usuario ? [{ key: 'amigos', label: 'De amigos' }] : []),
                            ...(usuario ? [{ key: 'mias', label: 'Mías' }] : []),
                        ].map((t) => (
                            <button key={t.key} onClick={() => setSubTabResenas(t.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        subTabResenas === t.key ? 'bg-terra text-white' : 'bg-dark-elevated text-dark-muted hover:text-dark-text'
                                    }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Lista de reseñas según sub-tab */}
                    {(() => {
                        const lista = subTabResenas === 'amigos' ? resenasAmigos
                            : subTabResenas === 'mias' ? misResenas
                                : resenas
                        return lista.length === 0 ? (
                            <div className="text-center py-8 bg-dark-card rounded-2xl">
                                <p className="text-dark-muted">
                                    {subTabResenas === 'amigos' ? 'Tus amigos aún no han reseñado este libro'
                                        : subTabResenas === 'mias' ? 'No has reseñado este libro'
                                            : 'Aún no hay reseñas para este libro'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {lista.map((r) => (
                                        <ResenaCard key={r.idresena} resena={r} mostrarLibro={false} />
                                    ))}
                                </div>
                                {subTabResenas === 'todas' && totalResenas > 5 && (
                                    <div className="text-center mt-4">
                                        <Link to={`/libro/${id}/resenas`} className="text-sm text-dark-muted hover:text-terra transition-colors">
                                            Ver todas ({totalResenas})
                                        </Link>
                                    </div>
                                )}
                            </>
                        )
                    })()}
                </div>
            )}

            {/* Contenido de Anotaciones */}
            {tabPrincipal === 'anotaciones' && (
                <div className="mb-12">
                    {/* Sub-tabs */}
                    <div className="flex gap-2 mb-5">
                        {[
                            { key: 'todas', label: 'Todas' },
                            ...(usuario ? [{ key: 'amigos', label: 'De amigos' }] : []),
                            ...(usuario ? [{ key: 'mias', label: 'Mias' }] : []),
                        ].map((t) => (
                            <button key={t.key} onClick={() => setSubTabAnotaciones(t.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        subTabAnotaciones === t.key ? 'bg-terra text-white' : 'bg-dark-elevated text-dark-muted hover:text-dark-text'
                                    }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Lista de anotaciones según sub-tab */}
                    {(() => {
                        const lista = subTabAnotaciones === 'amigos' ? anotacionesAmigos
                            : subTabAnotaciones === 'mias' ? misAnotaciones
                                : anotacionesPublicas
                        return lista.length === 0 ? (
                            <div className="text-center py-8 bg-dark-card rounded-2xl">
                                <p className="text-dark-muted">
                                    {subTabAnotaciones === 'amigos' ? 'Tus amigos no tienen anotaciones en este libro'
                                        : subTabAnotaciones === 'mias' ? 'No tienes anotaciones en este libro'
                                            : 'No hay anotaciones públicas para este libro'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {lista.map((a) => (
                                    <div key={a.idanotacion} className="bg-dark-card p-4 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span onClick={() => navigate(`/usuario/${a.idusuario}`)}
                                                      className="text-dark-text text-sm font-medium hover:text-terra transition-colors cursor-pointer">
                                                    {a.nombreUsuario}
                                                </span>
                                                <span className="text-dark-muted text-xs">{new Date(a.fecha).toLocaleDateString()}</span>
                                                {(a.parte || a.numPagina) && (
                                                    <span className="text-dark-muted text-xs">
                                                        · {a.parte}{a.parte && a.numPagina ? ' · ' : ''}{a.numPagina ? `Pág. ${a.numPagina}` : ''}
                                                    </span>
                                                )}
                                                {!a.esPublica && (
                                                    <span className="text-xs bg-dark-elevated text-dark-muted px-2 py-0.5 rounded-full">Privada</span>
                                                )}
                                            </div>
                                            {usuario && (usuario.id === a.idusuario || usuario.rol === 'ADMIN') && (
                                                <button onClick={async (e) => {
                                                    e.stopPropagation()
                                                    if (!window.confirm('¿Eliminar esta anotación?')) return
                                                    try {
                                                        await api.delete(`/anotaciones/${a.idanotacion}`)
                                                        cargarAnotaciones()
                                                        cargarMisAnotaciones()
                                                        cargarAnotacionesAmigos()
                                                    } catch { alert('Error al eliminar') }
                                                }}
                                                        className="text-red-400/60 hover:text-red-400 text-xs transition-colors">
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                        <SpoilerOculto activo={a.tieneSpoiler && usuario?.id !== a.idusuario}>
                                            <div>
                                                {a.titulo && <p className="text-dark-text font-medium text-sm mb-1">{a.titulo}</p>}
                                                <p className="text-dark-text/70 text-sm">{a.texto}</p>
                                            </div>
                                        </SpoilerOculto>
                                    </div>
                                ))}
                            </div>
                        )
                    })()}
                </div>
            )}

            {/* Modal confirmación empezar a leer */}
            {mostrarListas && <GuardarEnListaModal idlibro={parseInt(id)} onClose={() => setMostrarListas(false)} />}

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