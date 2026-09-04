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

    useEffect(() => { cargarAutor(); cargarLibros() }, [id])
    const cargarAutor = async () => {
        try { const res = await api.get(`/autores/${id}`); setAutor(res.data) }
        catch (err) { console.error('Error:', err) } finally { setLoading(false) }
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
        <div>
            <div className="bg-dark-card rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-6">
                    {autor.foto ? <img src={autor.foto} alt={autor.nombre} className="w-24 h-24 rounded-full object-cover" />
                        : <div className="w-24 h-24 bg-terra/20 rounded-full flex items-center justify-center text-terra text-3xl font-bold">{autor.nombre?.charAt(0)}</div>}
                    <div>
                        <h1 className="text-2xl font-bold text-dark-text">{autor.nombre}</h1>
                        {autor.nacionalidad && <p className="text-dark-muted">{autor.nacionalidad}</p>}
                        <p className="text-sm text-dark-muted mt-1">{autor.seguidores || 0} seguidores</p>
                        {usuario && (
                            <button onClick={toggleSeguir}
                                    className={`mt-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${siguiendo ? 'border border-dark-border text-dark-text hover:border-red-400 hover:text-red-400' : 'bg-terra hover:bg-terra-hover text-white'}`}>
                                {siguiendo ? 'Dejar de seguir' : 'Seguir'}
                            </button>
                        )}
                    </div>
                </div>
                {autor.biografia && <p className="text-dark-text/80 mt-4 leading-relaxed">{autor.biografia}</p>}
            </div>

            <h2 className="text-xl font-semibold text-dark-text mb-4">Libros</h2>
            {libros.length === 0 ? <p className="text-dark-muted">No hay libros</p> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {libros.map((libro) => (
                        <Link key={libro.idlibro} to={`/libro/${libro.idlibro}`} className="group">
                            <div className="bg-dark-card rounded-xl overflow-hidden hover:bg-dark-elevated transition-colors">
                                {libro.portada ? <img src={libro.portada} alt={libro.titulo} className="w-full h-48 object-cover" />
                                    : <div className="w-full h-48 bg-dark-elevated flex items-center justify-center text-dark-muted text-sm">Sin portada</div>}
                                <div className="p-2"><p className="text-sm text-dark-text truncate group-hover:text-terra transition-colors">{libro.titulo}</p></div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}