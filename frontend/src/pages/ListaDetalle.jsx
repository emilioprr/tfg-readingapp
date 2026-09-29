import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LibroCard from '../components/LibroCard'
import AnadirLibrosModal from '../components/AnadirLibrosModal'
import api from '../api/axios'

function Corazon({ lleno }) {
    return lleno ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    )
}

export default function ListaDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [lista, setLista] = useState(null)
    const [loading, setLoading] = useState(true)
    const [anadiendo, setAnadiendo] = useState(false)

    const cargarLista = useCallback(async () => {
        try { const res = await api.get(`/listas/${id}`); setLista(res.data) }
        catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }, [id])

    useEffect(() => { cargarLista() }, [cargarLista, id])

    const quitarLibro = async (idlibro) => {
        try { await api.delete(`/listas/${id}/libros/${idlibro}`); cargarLista() }
        catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    const toggleLike = async () => {
        const estaba = lista.likeada
        // Se marca al momento; si falla, se deshace
        setLista(l => ({ ...l, likeada: !estaba, numLikes: Math.max((l.numLikes || 0) + (estaba ? -1 : 1), 0) }))
        try {
            if (estaba) await api.delete(`/listas/${id}/like`)
            else await api.post(`/listas/${id}/like`)
        } catch (err) {
            setLista(l => ({ ...l, likeada: estaba, numLikes: Math.max((l.numLikes || 0) + (estaba ? 1 : -1), 0) }))
            alert(err.response?.data?.mensaje || 'Error')
        }
    }

    const eliminarLista = async () => {
        if (!window.confirm('¿Eliminar esta lista?')) return
        try { await api.delete(`/listas/${id}`); navigate('/perfil') }
        catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!lista) return <p className="text-red-400">Lista no encontrada</p>

    const esMia = usuario && lista.idusuario === usuario.id
    const libros = lista.libros || []

    return (
        <div>
            <div className="mb-8">
                {/* En móvil los botones van debajo del título para que no se partan */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-dark-text tracking-tight">{lista.nombre}</h1>
                        <p className="text-dark-muted text-sm mt-0.5">
                            de <Link to={esMia ? '/perfil?tab=listas' : `/usuario/${lista.idusuario}`} className="hover:text-terra transition-colors">{lista.nombreUsuario}</Link>
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 whitespace-nowrap flex-shrink-0">
                        {esMia && (
                            <Link to={`/crear-lista?editar=${id}&volver=/lista/${id}`}
                                  className="text-sm text-dark-muted hover:text-terra transition-colors">
                                Editar
                            </Link>
                        )}
                        {esMia && (
                            <button onClick={() => setAnadiendo(true)}
                                    className="text-sm bg-terra hover:bg-terra-hover text-white font-semibold px-4 py-1.5 rounded-lg transition-colors">
                                + Añadir libros
                            </button>
                        )}
                        {(esMia || (usuario && usuario.rol === 'ADMIN')) && (
                            <button onClick={eliminarLista} className="text-red-400 hover:text-red-300 text-sm transition-colors">
                                Eliminar lista
                            </button>
                        )}
                    </div>
                </div>
                {lista.descripcion && <p className="text-dark-muted mt-2">{lista.descripcion}</p>}
                <div className="flex items-center gap-3 mt-3 text-xs">
                    {lista.esPublica ? (
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">Pública</span>
                    ) : (
                        <span className="bg-dark-elevated text-dark-muted px-2 py-1 rounded-full">Privada</span>
                    )}
                    <span className="text-dark-muted">{libros.length} {libros.length === 1 ? 'libro' : 'libros'}</span>
                    {usuario && (
                        <button onClick={toggleLike} title={lista.likeada ? 'Quitar me gusta' : 'Me gusta'}
                                className={`flex items-center gap-1 transition-colors ${lista.likeada ? 'text-red-500' : 'text-dark-muted hover:text-red-500'}`}>
                            <Corazon lleno={lista.likeada} />
                            <span className="text-sm tabular-nums">{lista.numLikes || 0}</span>
                        </button>
                    )}
                </div>
            </div>

            {anadiendo && (
                <AnadirLibrosModal idlista={lista.idlista} idsEnLista={libros.map(l => l.idlibro)}
                                   onCambio={cargarLista} onClose={() => setAnadiendo(false)} />
            )}

            {libros.length === 0 ? (
                <div className="text-center py-16 bg-dark-card rounded-2xl">
                    <p className="text-dark-muted">Esta lista está vacía</p>
                    {esMia && (
                        <button onClick={() => setAnadiendo(true)} className="mt-2 text-terra hover:text-terra-hover text-sm transition-colors">
                            Añade el primer libro
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
                    {libros.map((libro) => (
                        <div key={libro.idlibro} className="group relative">
                            <LibroCard libro={libro} className="w-full" />
                            {esMia && (
                                // Siempre visible en pantallas táctiles; en escritorio aparece al pasar el ratón
                                <button onClick={() => quitarLibro(libro.idlibro)} title="Quitar de la lista"
                                        className="absolute top-1 right-1 bg-black/60 text-red-400 hover:text-red-300 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}