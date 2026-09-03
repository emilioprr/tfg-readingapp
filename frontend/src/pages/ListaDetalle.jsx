import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function ListaDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [lista, setLista] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarLista()
    }, [id])

    const cargarLista = async () => {
        try {
            const res = await api.get(`/listas/${id}`)
            setLista(res.data)
        } catch (err) {
            console.error('Error cargando lista:', err)
        } finally {
            setLoading(false)
        }
    }

    const quitarLibro = async (idlibro) => {
        try {
            await api.delete(`/listas/${id}/libros/${idlibro}`)
            cargarLista()
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error al quitar libro')
        }
    }

    const eliminarLista = async () => {
        if (!window.confirm('¿Seguro que quieres eliminar esta lista?')) return
        try {
            await api.delete(`/listas/${id}`)
            navigate('/perfil')
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error al eliminar lista')
        }
    }

    if (loading) return <p className="text-gray-400">Cargando...</p>
    if (!lista) return <p className="text-red-400">Lista no encontrada</p>

    const esMia = usuario && lista.idusuario === usuario.id
    const libros = lista.libros || []

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-amber-400">{lista.nombre}</h1>
                    {lista.descripcion && <p className="text-gray-400 mt-1">{lista.descripcion}</p>}
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        {lista.esPublica ? (
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">Pública</span>
                        ) : (
                            <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded">Privada</span>
                        )}
                        {lista.esAutomatica && (
                            <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded">Automática</span>
                        )}
                        <span>{libros.length} libros</span>
                    </div>
                </div>
                {esMia && !lista.esAutomatica && (
                    <button onClick={eliminarLista}
                            className="text-red-400 hover:text-red-300 text-sm">
                        Eliminar lista
                    </button>
                )}
            </div>

            {libros.length === 0 ? (
                <p className="text-gray-500">Esta lista está vacía</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {libros.map((libro) => (
                        <div key={libro.idlibro} className="group relative">
                            <Link to={`/libro/${libro.idlibro}`}>
                                <div className="bg-gray-900 rounded-lg border border-gray-800 hover:border-amber-500/40 overflow-hidden">
                                    {libro.portada ? (
                                        <img src={libro.portada} alt={libro.titulo} className="w-full h-48 object-cover" />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                                            Sin portada
                                        </div>
                                    )}
                                    <div className="p-2">
                                        <p className="text-sm text-gray-200 truncate group-hover:text-amber-400">{libro.titulo}</p>
                                        <p className="text-xs text-gray-500 truncate">{libro.nombreAutor}</p>
                                    </div>
                                </div>
                            </Link>
                            {esMia && !lista.esAutomatica && (
                                <button onClick={() => quitarLibro(libro.idlibro)}
                                        className="absolute top-1 right-1 bg-black/60 text-red-400 hover:text-red-300 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">
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