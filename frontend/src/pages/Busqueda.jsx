import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Busqueda() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''
    const { usuario } = useAuth()

    const [tab, setTab] = useState('libros')
    const [resultados, setResultados] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (query) buscar()
    }, [query, tab])

    const buscar = async () => {
        setLoading(true)
        try {
            let res
            if (tab === 'libros') {
                res = await api.get(`/libros/buscar?titulo=${query}&size=50`)
            } else if (tab === 'autores') {
                res = await api.get(`/autores/buscar?nombre=${query}`)
            } else {
                res = await api.get(`/usuarios/buscar?nombre=${query}`)
            }
            setResultados(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error buscando:', err)
            setResultados([])
        } finally {
            setLoading(false)
        }
    }

    const seguir = async (idSeguido) => {
        try {
            await api.post(`/usuarios/${usuario.id}/seguir/${idSeguido}`)
            buscar()
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

            {/* Tabs */}
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
                    {/* Libros */}
                    {tab === 'libros' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {resultados.map((libro) => (
                                <Link key={libro.idlibro} to={`/libro/${libro.idlibro}`} className="group">
                                    <div className="bg-dark-card rounded-xl overflow-hidden hover:bg-dark-elevated transition-colors">
                                        {libro.portada ? (
                                            <img src={libro.portada} alt={libro.titulo} className="w-full h-48 object-cover" />
                                        ) : (
                                            <div className="w-full h-48 bg-dark-elevated flex items-center justify-center text-dark-muted text-sm">
                                                Sin portada
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <p className="text-sm text-dark-text truncate group-hover:text-terra transition-colors">
                                                {libro.titulo}
                                            </p>
                                            <p className="text-xs text-dark-muted truncate mt-0.5">{libro.nombreAutor}</p>
                                            {libro.genero && (
                                                <span className="inline-block text-xs bg-dark-elevated text-dark-muted px-2 py-0.5 rounded mt-1.5">
                          {libro.genero}
                        </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Autores */}
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

                    {/* Usuarios */}
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