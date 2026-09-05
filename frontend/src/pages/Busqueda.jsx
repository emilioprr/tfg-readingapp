import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LibroCard from '../components/LibroCard'
import api from '../api/axios'

export default function Busqueda() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''
    const { usuario } = useAuth()

    const [tab, setTab] = useState('libros')
    const [resultados, setResultados] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagina, setPagina] = useState(0)
    const [hayMas, setHayMas] = useState(true)
    const [cargandoMas, setCargandoMas] = useState(false)

    const paginaRef = useRef(0)
    const hayMasRef = useRef(true)
    const cargandoMasRef = useRef(false)

    useEffect(() => {
        if (query) {
            setResultados([])
            setPagina(0)
            paginaRef.current = 0
            hayMasRef.current = true
            setHayMas(true)
            buscar(0, true)
        }
    }, [query, tab])

    const buscar = async (pag = 0, reset = false) => {
        if (cargandoMasRef.current) return
        if (reset) setLoading(true)
        else { setCargandoMas(true); cargandoMasRef.current = true }

        try {
            const size = 24
            if (tab === 'libros') {
                const res = await api.get(`/libros/buscar?titulo=${query}&page=${pag}&size=${size}`)
                const datos = res.data.content || res.data || []
                if (reset) setResultados(datos)
                else setResultados(prev => {
                    const ids = new Set(prev.map(l => l.idlibro))
                    return [...prev, ...datos.filter(l => !ids.has(l.idlibro))]
                })
                paginaRef.current = pag
                setPagina(pag)
                hayMasRef.current = datos.length === size
                setHayMas(datos.length === size)
            } else if (tab === 'autores') {
                const res = await api.get(`/autores/buscar?nombre=${query}`)
                setResultados(res.data.content || res.data || [])
                hayMasRef.current = false
                setHayMas(false)
            } else {
                const res = await api.get(`/usuarios/buscar?nombre=${query}`)
                setResultados(res.data.content || res.data || [])
                hayMasRef.current = false
                setHayMas(false)
            }
        } catch (err) {
            console.error('Error buscando:', err)
            if (reset) setResultados([])
        } finally {
            setLoading(false)
            setCargandoMas(false)
            cargandoMasRef.current = false
        }
    }

    const cargarMas = () => {
        if (cargandoMasRef.current || !hayMasRef.current) return
        buscar(paginaRef.current + 1, false)
    }

    const seguir = async (idSeguido) => {
        try {
            await api.post(`/usuarios/${usuario.id}/seguir/${idSeguido}`)
            buscar(0, true)
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error')
        }
    }

    const tabs = [
        { key: 'libros', label: 'Libros' },
        { key: 'autores', label: 'Autores' },
        { key: 'usuarios', label: 'Usuarios' },
    ]

    if (!query) return <p className="text-dark-muted">Escribe algo para buscar</p>

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-dark-text tracking-tight mb-1">
                    Resultados para "{query}"
                </h1>
            </div>

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

            {loading ? (
                <p className="text-dark-muted">Buscando...</p>
            ) : resultados.length === 0 ? (
                <div className="text-center py-16 bg-dark-card rounded-2xl">
                    <p className="text-dark-muted mb-2">No se encontraron resultados</p>
                    <p className="text-dark-muted text-sm">Prueba con otros términos</p>
                </div>
            ) : (
                <>
                    {tab === 'libros' && (
                        <div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
                                {resultados.map((libro) => (
                                    <LibroCard key={libro.idlibro} libro={libro} className="w-full" />
                                ))}
                            </div>

                            {hayMas && (
                                <div className="flex justify-center mt-8">
                                    <button onClick={cargarMas} disabled={cargandoMas}
                                            className="bg-dark-card hover:bg-dark-elevated text-dark-text font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                                        {cargandoMas ? 'Cargando...' : 'Cargar más'}
                                    </button>
                                </div>
                            )}

                            {!hayMas && resultados.length > 0 && (
                                <p className="text-dark-muted text-center mt-8 text-sm">No hay más resultados</p>
                            )}
                        </div>
                    )}

                    {tab === 'autores' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {resultados.map((autor) => (
                                <Link key={autor.idautor} to={`/autor/${autor.idautor}`}
                                      className="bg-dark-card rounded-xl p-4 flex items-center gap-4 hover:bg-dark-elevated transition-colors">
                                    {autor.foto ? (
                                        <img src={autor.foto} alt={autor.nombre} className="w-14 h-14 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-14 h-14 bg-terra/20 rounded-full flex items-center justify-center text-terra text-xl font-bold">
                                            {autor.nombre?.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-dark-text font-medium truncate">{autor.nombre}</p>
                                        {autor.nacionalidad && (
                                            <p className="text-dark-muted text-sm truncate">{autor.nacionalidad}</p>
                                        )}
                                        <p className="text-dark-muted text-xs mt-0.5">{autor.seguidores || 0} seguidores</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {tab === 'usuarios' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {resultados.map((u) => (
                                <div key={u.idusuario}
                                     className="bg-dark-card rounded-xl p-4 flex items-center justify-between hover:bg-dark-elevated transition-colors">
                                    <Link to={`/usuario/${u.idusuario}`} className="flex items-center gap-4 min-w-0">
                                        {u.avatar ? (
                                            <img src={u.avatar} alt={u.nombre} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 bg-terra/20 rounded-full flex items-center justify-center text-terra text-lg font-bold">
                                                {u.nombre?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-dark-text font-medium truncate">{u.nombre}</p>
                                            <p className="text-dark-muted text-sm">{u.seguidores || 0} seguidores</p>
                                        </div>
                                    </Link>
                                    {usuario && u.idusuario !== usuario.id && (
                                        <button onClick={() => seguir(u.idusuario)}
                                                className="bg-terra hover:bg-terra-hover text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors flex-shrink-0 ml-4">
                                            Seguir
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