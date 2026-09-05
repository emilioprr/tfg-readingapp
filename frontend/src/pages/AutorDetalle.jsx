import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LibroCard from '../components/LibroCard'
import api from '../api/axios'

export default function AutorDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const [autor, setAutor] = useState(null)
    const [libros, setLibros] = useState([])
    const [siguiendo, setSiguiendo] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => { cargarAutor(); cargarLibros() }, [id])

    const cargarAutor = async () => {
        try { const res = await api.get(`/autores/${id}`); setAutor(res.data) }
        catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const cargarLibros = async () => {
        try { const res = await api.get(`/libros/autor/${id}`); setLibros(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }

    const toggleSeguir = async () => {
        try {
            if (siguiendo) await api.delete(`/autores/${id}/seguir/${usuario.id}`)
            else await api.post(`/autores/${id}/seguir/${usuario.id}`)
            setSiguiendo(!siguiendo); cargarAutor()
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!autor) return <p className="text-red-400">Autor no encontrado</p>

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header centrado */}
            <div className="text-center mb-12">
                <div className="flex justify-center mb-4">
                    {autor.foto ? (
                        <img src={autor.foto} alt={autor.nombre}
                             className="w-28 h-28 rounded-full object-cover ring-4 ring-dark-border" />
                    ) : (
                        <div className="w-28 h-28 bg-terra/20 rounded-full flex items-center justify-center text-terra text-5xl font-bold ring-4 ring-dark-border">
                            {autor.nombre?.charAt(0)}
                        </div>
                    )}
                </div>

                <h1 className="text-3xl font-bold text-dark-text tracking-tight mb-1">{autor.nombre}</h1>

                {autor.nacionalidad && (
                    <p className="text-dark-muted text-sm mt-1">{autor.nacionalidad}</p>
                )}

                <div className="flex items-center justify-center gap-6 mt-3 text-sm text-dark-muted">
                    <span>{autor.seguidores || 0} seguidores</span>
                    <span className="w-1 h-1 bg-dark-border rounded-full" />
                    <span>{libros.length} libros</span>
                </div>

                {usuario && (
                    <button onClick={toggleSeguir}
                            className={`mt-4 px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                siguiendo
                                    ? 'border border-dark-border text-dark-text hover:border-red-400 hover:text-red-400'
                                    : 'bg-terra hover:bg-terra-hover text-white'
                            }`}>
                        {siguiendo ? 'Dejar de seguir' : 'Seguir'}
                    </button>
                )}

                {autor.biografia && (
                    <p className="text-dark-muted text-sm max-w-lg mx-auto leading-relaxed mt-5">{autor.biografia}</p>
                )}
            </div>

            {/* Libros */}
            <div>
                <h2 className="text-lg font-semibold text-dark-text mb-5">Libros</h2>
                {libros.length === 0 ? (
                    <div className="text-center py-8 bg-dark-card rounded-2xl">
                        <p className="text-dark-muted text-sm">No hay libros de este autor</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
                        {libros.map((libro) => (
                            <LibroCard key={libro.idlibro} libro={libro} className="w-full" />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}