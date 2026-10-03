import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LibroCard from '../components/LibroCard'
import AnadirLibrosModal from '../components/AnadirLibrosModal'
import api from '../api/axios'
import { X, Heart, Plus, PencilSimple, Trash } from '@phosphor-icons/react'
import { useAvisos } from '../context/AvisosContext'

function Corazon({ lleno }) {
    return <Heart size={20} weight={lleno ? 'fill' : 'regular'} />
}

export default function ListaDetalle() {
    const { avisar, confirmar, avisarCarga } = useAvisos()
    const { id } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [lista, setLista] = useState(null)
    const [loading, setLoading] = useState(true)
    const [anadiendo, setAnadiendo] = useState(false)

    const cargarLista = useCallback(async () => {
        try { const res = await api.get(`/listas/${id}`); setLista(res.data) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar la lista.') }
        finally { setLoading(false) }
    }, [avisarCarga, id])

    useEffect(() => { cargarLista() }, [cargarLista, id])

    const quitarLibro = async (idlibro) => {
        try { await api.delete(`/listas/${id}/libros/${idlibro}`); cargarLista() }
        catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
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
            avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.')
        }
    }

    const eliminarLista = async () => {
        if (!await confirmar({ titulo: '¿Eliminar esta lista?', texto: 'Los libros no se borran, solo la lista.', aceptar: 'Eliminar', peligro: true })) return
        try { await api.delete(`/listas/${id}`); navigate('/perfil') }
        catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    if (loading) return <p className="text-texto-sec">Cargando…</p>
    if (!lista) return <p className="font-serif text-xl text-texto-sec">Esta lista no existe, es privada o no se ha podido cargar.</p>

    const esMia = usuario && lista.idusuario === usuario.id
    const libros = lista.libros || []

    return (
        <div>
            <div className="mb-8">
                {/* En móvil los botones van debajo del título para que no se partan */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="font-serif text-4xl leading-none text-texto">{lista.nombre}</h1>
                        <p className="text-texto-sec text-sm mt-0.5">
                            de <Link to={esMia ? '/perfil?tab=listas' : `/usuario/${lista.idusuario}`} className="text-texto hover:text-acento">{lista.nombreUsuario}</Link>
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 whitespace-nowrap flex-shrink-0">
                        {esMia && (
                            <button onClick={() => setAnadiendo(true)} className="btn-acento">
                                <Plus size={14} /> Añadir libros
                            </button>
                        )}
                        {esMia && (
                            <Link to={`/crear-lista?editar=${id}&volver=/lista/${id}`} className="btn-secundario">
                                <PencilSimple size={14} /> Editar
                            </Link>
                        )}
                        {(esMia || (usuario && usuario.rol === 'ADMIN')) && (
                            <button onClick={eliminarLista} className="btn text-error hover:bg-error/10">
                                <Trash size={14} /> Eliminar
                            </button>
                        )}
                    </div>
                </div>
                {lista.descripcion && <p className="text-texto-sec mt-2">{lista.descripcion}</p>}
                <div className="flex items-center gap-3 mt-3 text-xs">
                    {lista.esPublica ? (
                        <span className="border border-linea text-texto-sec px-1.5 py-0.5 rounded">Pública</span>
                    ) : (
                        <span className="border border-linea text-texto-ter px-1.5 py-0.5 rounded">Privada</span>
                    )}
                    <span className="text-texto-sec">{libros.length} {libros.length === 1 ? 'libro' : 'libros'}</span>
                    {usuario ? (
                        <button onClick={toggleLike} title={lista.likeada ? 'Quitar me gusta' : 'Me gusta'}
                                aria-label={lista.likeada ? 'Quitar me gusta' : 'Me gusta'} aria-pressed={!!lista.likeada}
                                className={`flex items-center gap-1 ${lista.likeada ? 'text-acento' : 'text-texto-sec hover:text-acento'}`}>
                            <Corazon lleno={lista.likeada} />
                            <span className="text-sm tabular-nums">{lista.numLikes || 0}</span>
                        </button>
                    ) : lista.numLikes > 0 && (
                        <span className="flex items-center gap-1 text-texto-sec" title="Me gusta">
                            <Corazon lleno={false} />
                            <span className="text-sm tabular-nums">{lista.numLikes}</span>
                        </span>
                    )}
                </div>
            </div>

            {anadiendo && (
                <AnadirLibrosModal idlista={lista.idlista} idsEnLista={libros.map(l => l.idlibro)}
                                   onCambio={cargarLista} onClose={() => setAnadiendo(false)} />
            )}

            {libros.length === 0 ? (
                <div className="py-6">
                    <p className="font-serif text-xl text-texto-sec mb-3">Esta lista espera su primer libro.</p>
                    {esMia && (
                        <button onClick={() => setAnadiendo(true)} className="mt-2 text-acento hover:text-acento-hover text-sm transition-colors">
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
                                        aria-label="Quitar de la lista"
                                        className="absolute top-1 right-1 bg-fondo/80 text-texto-sec hover:text-error rounded-full w-6 h-6 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}