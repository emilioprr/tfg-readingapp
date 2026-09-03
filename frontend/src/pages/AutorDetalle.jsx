import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function AutorDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const [autor, setAutor] = useState(null)
    const [libros, setLibros] = useState([])
    const [siguiendo, setSiguiendo] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarAutor()
        cargarLibros()
    }, [id])

    const cargarAutor = async () => {
        try {
            const res = await api.get(`/autores/${id}`)
            setAutor(res.data)
        } catch (err) {
            console.error('Error cargando autor:', err)
        } finally {
            setLoading(false)
        }
    }

    const cargarLibros = async () => {
        try {
            const res = await api.get(`/libros/autor/${id}`)
            setLibros(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando libros del autor:', err)
        }
    }

    const toggleSeguir = async () => {
        try {
            if (siguiendo) {
                await api.delete(`/autores/${id}/seguir/${usuario.id}`)
            } else {
                await api.post(`/autores/${id}/seguir/${usuario.id}`)
            }
            setSiguiendo(!siguiendo)
            cargarAutor()
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error')
        }
    }

    if (loading) return <p className="text-gray-400">Cargando...</p>
    if (!autor) return <p className="text-red-400">Autor no encontrado</p>

    return (
        <div>
            <div className="bg-gray-900 rounded-lg border border-amber-500/20 p-6 mb-6">
                <div className="flex items-center gap-6">
                    {autor.foto ? (
                        <img src={autor.foto} alt={autor.nombre} className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                        <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-3xl font-bold">
                            {autor.nombre?.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-amber-400">{autor.nombre}</h1>
                        {autor.nacionalidad && <p className="text-gray-400">{autor.nacionalidad}</p>}
                        <p className="text-sm text-gray-500 mt-1">{autor.seguidores || 0} seguidores</p>
                        {usuario && (
                            <button onClick={toggleSeguir}
                                    className={`mt-2 px-4 py-1 rounded text-sm font-bold ${
                                        siguiendo
                                            ? 'border border-amber-500/40 text-amber-400 hover:bg-red-500/10 hover:text-red-400'
                                            : 'bg-amber-500 hover:bg-amber-600 text-gray-900'
                                    }`}>
                                {siguiendo ? 'Dejar de seguir' : 'Seguir'}
                            </button>
                        )}
                    </div>
                </div>
                {autor.biografia && <p className="text-gray-300 mt-4 leading-relaxed">{autor.biografia}</p>}
            </div>

            <h2 className="text-xl font-bold text-amber-400 mb-4">Libros</h2>
            {libros.length === 0 ? (
                <p className="text-gray-500">No hay libros de este autor</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {libros.map((libro) => (
                        <Link key={libro.idlibro} to={`/libro/${libro.idlibro}`} className="group">
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
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}