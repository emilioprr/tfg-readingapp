import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ResenaCard from '../components/ResenaCard'
import api from '../api/axios'

export default function MisLikes() {
    const { usuario } = useAuth()
    const [resenas, setResenas] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { cargarLikes() }, [])

    const cargarLikes = async () => {
        try {
            const res = await api.get(`/resenas/likes/${usuario.id}`)
            setResenas(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text mb-6 tracking-tight">Reseñas que me gustan</h1>
            {resenas.length === 0 ? (
                <div className="text-center py-10 bg-dark-card rounded-2xl">
                    <p className="text-dark-muted mb-2">No has dado like a ninguna reseña</p>
                    <Link to="/catalogo" className="text-terra hover:text-terra-hover text-sm transition-colors">Explorar libros</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {resenas.map((r) => (
                        <ResenaCard key={r.idresena} resena={r} />
                    ))}
                </div>
            )}
        </div>
    )
}