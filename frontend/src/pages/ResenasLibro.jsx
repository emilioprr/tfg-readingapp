import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ResenaCard from '../components/ResenaCard'
import api from '../api/axios'

export default function ResenasLibro() {
    const { id } = useParams()
    const [resenas, setResenas] = useState([])
    const [libro, setLibro] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarResenas()
        cargarLibro()
    }, [id])

    const cargarResenas = async () => {
        try {
            const res = await api.get(`/resenas/libro/${id}?size=200`)
            setResenas(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const cargarLibro = async () => {
        try {
            const res = await api.get(`/libros/${id}`)
            setLibro(res.data)
        } catch (err) { console.error('Error:', err) }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-dark-text tracking-tight">Reseñas</h1>
                    {libro && (
                        <Link to={`/libro/${id}`} className="text-terra hover:text-terra-hover text-sm transition-colors">
                            {libro.titulo}
                        </Link>
                    )}
                </div>
                <span className="text-dark-muted text-sm">{resenas.length} reseñas</span>
            </div>

            {resenas.length === 0 ? (
                <div className="text-center py-16 bg-dark-card rounded-2xl">
                    <p className="text-dark-muted">No hay reseñas para este libro</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {resenas.map((r) => (
                        <ResenaCard key={r.idresena} resena={r} mostrarLibro={false} />
                    ))}
                </div>
            )}
        </div>
    )
}