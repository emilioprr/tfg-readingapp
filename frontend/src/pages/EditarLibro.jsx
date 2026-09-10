import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function EditarLibro() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [titulo, setTitulo] = useState('')
    const [sinopsis, setSinopsis] = useState('')
    const [genero, setGenero] = useState('')
    const [numPaginas, setNumPaginas] = useState('')
    const [portada, setPortada] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => { cargarLibro() }, [id])

    const cargarLibro = async () => {
        try {
            const res = await api.get(`/libros/${id}`)
            const libro = res.data
            setTitulo(libro.titulo || '')
            setSinopsis(libro.sinopsis || '')
            setGenero(libro.genero || '')
            setNumPaginas(libro.numPaginas || '')
            setPortada(libro.portada || '')
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await api.put(`/libros/${id}`, { titulo, sinopsis, genero, numPaginas: numPaginas ? parseInt(numPaginas) : null, portada })
            navigate(`/libro/${id}`)
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al actualizar')
        }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!usuario || usuario.rol !== 'ADMIN') return <p className="text-red-400">No tienes permiso</p>

    return (
        <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-terra tracking-tight">Editar libro</h1>
                <button onClick={() => navigate(-1)} className="text-dark-muted hover:text-dark-text text-2xl transition-colors">✕</button>
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-dark-muted text-sm mb-1">Título</label>
                    <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                           className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" required />
                </div>
                <div>
                    <label className="block text-dark-muted text-sm mb-1">Sinopsis</label>
                    <textarea value={sinopsis} onChange={(e) => setSinopsis(e.target.value)} rows={4}
                              className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" />
                </div>
                <div>
                    <label className="block text-dark-muted text-sm mb-1">Género</label>
                    <input type="text" value={genero} onChange={(e) => setGenero(e.target.value)}
                           className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" />
                </div>
                <div>
                    <label className="block text-dark-muted text-sm mb-1">Páginas</label>
                    <input type="number" value={numPaginas} onChange={(e) => setNumPaginas(e.target.value)}
                           className="w-32 bg-dark-elevated border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-terra focus:outline-none transition-colors" />
                </div>
                <div>
                    <label className="block text-dark-muted text-sm mb-1">URL de portada</label>
                    <input type="text" value={portada} onChange={(e) => setPortada(e.target.value)}
                           className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" />
                </div>
                <button type="submit" className="w-full bg-terra hover:bg-terra-hover text-white font-semibold py-2.5 rounded-lg transition-colors">Guardar cambios</button>
            </form>
        </div>
    )
}