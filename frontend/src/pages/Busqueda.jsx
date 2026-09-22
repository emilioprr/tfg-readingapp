import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const SIZE = 24

export default function Busqueda() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''
    const { usuario } = useAuth()
    const navigate = useNavigate()

    const [tab, setTab] = useState('libros')
    const [resultados, setResultados] = useState([])
    const [loading, setLoading] = useState(false)
    const [hayMas, setHayMas] = useState(false)
    const [cargandoMas, setCargandoMas] = useState(false)
    const [buscandoExternos, setBuscandoExternos] = useState(false)
    const [abriendo, setAbriendo] = useState(null)
    const [seguidos, setSeguidos] = useState([])

    const paginaLocal = useRef(0)
    const localAgotado = useRef(false)
    const googleIndex = useRef(0)
    const googleAgotado = useRef(false)
    const busquedaId = useRef(0)

    useEffect(() => {
        if (!query) return
        busquedaId.current++
        setResultados([])
        setHayMas(false)
        setLoading(true)
        setBuscandoExternos(false)
        paginaLocal.current = 0
        localAgotado.current = false
        googleIndex.current = 0
        googleAgotado.current = false

        if (tab === 'libros') {
            cargarMasLibros()
        } else if (tab === 'autores') {
            buscarAutores()
        } else {
            buscarUsuarios()
            if (usuario) cargarSeguidos()
        }
    }, [query, tab])

    const claveLibro = (l) => (l.externo ? `g-${l.idExterno}` : `l-${l.idlibro}`)

    const anadirLibros = (libros) => {
        setResultados(prev => {
            const claves = new Set(prev.map(claveLibro))
            return [...prev, ...libros.filter(l => !claves.has(claveLibro(l)))]
        })
    }

    // Primero agota la base de datos local; cuando se acaba, sigue con Google Books
    const cargarMasLibros = async () => {
        const id = busquedaId.current
        try {
            if (!localAgotado.current) {
                const res = await api.get(`/libros/buscar?titulo=${encodeURIComponent(query)}&page=${paginaLocal.current}&size=${SIZE}`)
                if (id !== busquedaId.current) return
                const locales = (res.data.content || res.data || []).map(l => ({ ...l, externo: false }))
                anadirLibros(locales)
                paginaLocal.current += 1
                setLoading(false)

                if (locales.length === SIZE) {
                    setHayMas(true)
                    return
                }
                // La página local no llegó a 24: rellenamos con Google en la misma tanda
                localAgotado.current = true
            }

            if (!googleAgotado.current) {
                setBuscandoExternos(true)
                const res = await api.get(`/libros/buscar/google?q=${encodeURIComponent(query)}&startIndex=${googleIndex.current}`)
                if (id !== busquedaId.current) return
                googleIndex.current = res.data.siguienteIndex
                googleAgotado.current = !res.data.hayMas
                anadirLibros(res.data.resultados || [])
            }

            setHayMas(!(localAgotado.current && googleAgotado.current))
        } catch (err) {
            console.error('Error buscando libros:', err)
        } finally {
            if (id === busquedaId.current) {
                setLoading(false)
                setBuscandoExternos(false)
                setCargandoMas(false)
            }
        }
    }

    const verMas = async () => {
        setCargandoMas(true)
        await cargarMasLibros()
    }

    // Los locales navegan directamente; los externos se importan al abrirlos
    const abrirLibro = async (libro) => {
        if (!libro.externo) {
            navigate(`/libro/${libro.idlibro}`)
            return
        }
        setAbriendo(libro.idExterno)
        try {
            const res = await api.post(`/libros/importar/google/${libro.idExterno}`)
            navigate(`/libro/${res.data.idlibro}`)
        } catch (err) {
            alert(err.response?.data?.mensaje || 'No se pudo abrir el libro')
        } finally {
            setAbriendo(null)
        }
    }

    const cargarSeguidos = async () => {
        try {
            const res = await api.get(`/usuarios/${usuario.id}/seguidos`)
            setSeguidos((res.data || []).map(u => u.idusuario))
        } catch (err) { console.error('Error:', err) }
    }

    const buscarAutores = async () => {
        try {
            const res = await api.get(`/autores/buscar?nombre=${encodeURIComponent(query)}`)
            setResultados(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const buscarUsuarios = async () => {
        try {
            const res = await api.get(`/usuarios/buscar?nombre=${encodeURIComponent(query)}`)
            setResultados(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const toggleSeguir = async (idusuario) => {
        try {
            if (seguidos.includes(idusuario)) {
                await api.delete(`/usuarios/${usuario.id}/seguir/${idusuario}`)
                setSeguidos(prev => prev.filter(id => id !== idusuario))
            } else {
                await api.post(`/usuarios/${usuario.id}/seguir/${idusuario}`)
                setSeguidos(prev => [...prev, idusuario])
            }
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    const tabs = [
        { key: 'libros', label: 'Libros' },
        { key: 'autores', label: 'Autores' },
        { key: 'usuarios', label: 'Usuarios' },
    ]

    if (!query) return <p className="text-dark-muted">Escribe algo para buscar</p>

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text tracking-tight mb-6">
                Resultados para "{query}"
            </h1>

            <div className="flex gap-2 mb-8 border-b border-dark-border">
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

            {loading && <p className="text-dark-muted">Buscando...</p>}

            {/* Libros */}
            {!loading && tab === 'libros' && (
                <>
                    {resultados.length === 0 && !buscandoExternos ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted">No se encontraron libros</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {resultados.map((libro) => (
                                <div key={claveLibro(libro)} onClick={() => abrirLibro(libro)}
                                     className="bg-dark-card rounded-xl p-4 hover:bg-dark-elevated transition-colors flex gap-4 group cursor-pointer relative">
                                    {libro.portada ? (
                                        <img src={libro.portada} alt={libro.titulo}
                                             className="w-16 h-24 object-cover rounded-sm flex-shrink-0 shadow-md" />
                                    ) : (
                                        <div className="w-16 h-24 bg-dark-elevated rounded-sm flex-shrink-0 flex items-center justify-center text-dark-muted text-xs shadow-md">
                                            📖
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-dark-text font-semibold group-hover:text-terra transition-colors truncate">{libro.titulo}</p>
                                        <p className="text-dark-muted text-sm">{libro.nombreAutor}</p>
                                        {libro.genero && (
                                            <span className="text-xs bg-dark-elevated text-dark-muted px-2 py-0.5 rounded mt-1 inline-block">{libro.genero}</span>
                                        )}
                                        {libro.sinopsis && (
                                            <p className="text-dark-muted text-xs mt-2 line-clamp-2">{libro.sinopsis}</p>
                                        )}
                                    </div>
                                    {libro.numPaginas && (
                                        <span className="text-dark-muted text-xs flex-shrink-0 self-start">{libro.numPaginas} pág.</span>
                                    )}
                                    {abriendo === libro.idExterno && (
                                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                            <span className="text-dark-text text-sm">Abriendo...</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {buscandoExternos && (
                        <p className="text-dark-muted text-sm text-center mt-4">Buscando más resultados...</p>
                    )}

                    {hayMas && !buscandoExternos && resultados.length > 0 && (
                        <div className="text-center mt-6">
                            <button onClick={verMas} disabled={cargandoMas}
                                    className="text-sm text-dark-muted hover:text-terra transition-colors disabled:opacity-50">
                                {cargandoMas ? 'Cargando...' : 'Ver más'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Autores */}
            {!loading && tab === 'autores' && (
                <>
                    {resultados.length === 0 ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted">No se encontraron autores</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {resultados.map((autor) => (
                                <Link key={autor.idautor} to={`/autor/${autor.idautor}`}
                                      className="bg-dark-card rounded-xl p-4 hover:bg-dark-elevated transition-colors flex items-center gap-4 group">
                                    {autor.foto ? (
                                        <img src={autor.foto} alt={autor.nombre}
                                             className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 bg-terra/20 rounded-full flex-shrink-0 flex items-center justify-center text-terra font-bold">
                                            {autor.nombre?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-dark-text font-semibold group-hover:text-terra transition-colors">{autor.nombre}</p>
                                        {autor.nacionalidad && (
                                            <p className="text-dark-muted text-sm">{autor.nacionalidad}</p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Usuarios */}
            {!loading && tab === 'usuarios' && (
                <>
                    {resultados.length === 0 ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted">No se encontraron usuarios</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {resultados.map((u) => (
                                <div key={u.idusuario}
                                     className="bg-dark-card rounded-xl p-4 hover:bg-dark-elevated transition-colors flex items-center gap-4">
                                    <Link to={`/usuario/${u.idusuario}`} className="flex items-center gap-4 flex-1 min-w-0">
                                        {u.avatar ? (
                                            <img src={u.avatar} alt={u.nombre}
                                                 className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 bg-terra/20 rounded-full flex-shrink-0 flex items-center justify-center text-terra font-bold text-lg">
                                                {u.nombre?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-dark-text font-semibold">{u.nombre}</p>
                                            <p className="text-dark-muted text-sm">{u.seguidores || 0} seguidores</p>
                                        </div>
                                    </Link>
                                    {usuario && u.idusuario !== usuario.id && (
                                        <button onClick={() => toggleSeguir(u.idusuario)}
                                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                                                    seguidos.includes(u.idusuario)
                                                        ? 'border border-dark-border text-dark-text hover:border-red-400 hover:text-red-400'
                                                        : 'bg-terra hover:bg-terra-hover text-white'
                                                }`}>
                                            {seguidos.includes(u.idusuario) ? 'Siguiendo' : 'Seguir'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}