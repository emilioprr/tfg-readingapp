import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function ListaCard({ lista }) {
    const [libros, setLibros] = useState([])

    useEffect(() => {
        cargarLibros()
    }, [lista.idlista])

    const cargarLibros = async () => {
        try {
            const res = await api.get(`/listas/${lista.idlista}`)
            setLibros((res.data.libros || []).slice(0, 4))
        } catch (err) { console.error('Error:', err) }
    }

    return (
        <Link to={`/lista/${lista.idlista}`}
              className="bg-dark-card rounded-xl overflow-hidden hover:bg-dark-elevated transition-colors group">
            {/* Preview de portadas */}
            <div className="h-32 relative overflow-hidden">
                {libros.length > 0 ? (
                    <div className={`grid h-full ${
                        libros.length === 1 ? 'grid-cols-1' :
                            libros.length === 2 ? 'grid-cols-2' :
                                libros.length === 3 ? 'grid-cols-3' :
                                    'grid-cols-4'
                    } gap-0.5`}>
                        {libros.map((libro) => (
                            <div key={libro.idlibro} className="overflow-hidden">
                                {libro.portada ? (
                                    <img src={libro.portada} alt={libro.titulo}
                                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                ) : (
                                    <div className="w-full h-full bg-dark-elevated flex items-center justify-center text-dark-muted text-xs">
                                        📖
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full bg-dark-elevated flex items-center justify-center">
                        <span className="text-dark-muted text-sm">Lista vacía</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4">
                <p className="text-terra font-medium group-hover:text-terra-hover transition-colors">{lista.nombre}</p>
                {lista.descripcion && (
                    <p className="text-dark-muted text-sm mt-1 line-clamp-1">{lista.descripcion}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-dark-muted">
                    {lista.nombreUsuario && <span>{lista.nombreUsuario}</span>}
                </div>
            </div>
        </Link>
    )
}

export default function Listas() {
    const { usuario } = useAuth()
    const [publicas, setPublicas] = useState([])
    const [misListas, setMisListas] = useState([])
    const [tab, setTab] = useState('explorar')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarPublicas()
        if (usuario) cargarMisListas()
    }, [usuario])

    const cargarPublicas = async () => {
        try {
            const res = await api.get('/listas/publicas')
            setPublicas(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const cargarMisListas = async () => {
        try {
            const res = await api.get(`/listas/usuario/${usuario.id}`)
            setMisListas(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }

    const tabs = [
        { key: 'explorar', label: 'Explorar' },
        ...(usuario ? [{ key: 'mis-listas', label: 'Mis listas' }] : []),
    ]

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-dark-text tracking-tight">Listas</h1>
                {usuario && (
                    <Link to="/crear-lista"
                          className="text-sm bg-terra hover:bg-terra-hover text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        + Nueva lista
                    </Link>
                )}
            </div>

            {tabs.length > 1 && (
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
            )}

            {tab === 'explorar' && (
                <>
                    {publicas.length === 0 ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted">No hay listas públicas todavía</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {publicas.map((lista) => (
                                <ListaCard key={lista.idlista} lista={lista} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {tab === 'mis-listas' && (
                <>
                    {misListas.length === 0 ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted mb-2">No tienes listas todavía</p>
                            <Link to="/crear-lista" className="text-terra hover:text-terra-hover text-sm transition-colors">
                                Crear tu primera lista
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {misListas.map((lista) => (
                                <ListaCard key={lista.idlista} lista={lista} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}