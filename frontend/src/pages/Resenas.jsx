import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ResenaCard from '../components/ResenaCard'
import api from '../api/axios'

export default function Resenas() {
    const { usuario } = useAuth()
    const [resenasAmigos, setResenasAmigos] = useState([])
    const [resenasPopulares, setResenasPopulares] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarResenasAmigos()
        cargarResenasPopulares()
    }, [usuario])

    const cargarResenasAmigos = async () => {
        if (!usuario) { setLoading(false); return }
        try {
            const res = await api.get(`/resenas/seguidos/${usuario.id}?size=20`)
            setResenasAmigos(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const cargarResenasPopulares = async () => {
        try {
            const res = await api.get('/resenas/populares?size=20')
            setResenasPopulares(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text tracking-tight mb-8">Reseñas</h1>

            {/* Nuevas reseñas de amigos */}
            {usuario && (
                <div className="mb-12">
                    <h2 className="text-xl font-semibold text-dark-text mb-5">Nuevas reseñas de amigos</h2>
                    {resenasAmigos.length === 0 ? (
                        <div className="text-center py-8 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted">Tus amigos aún no han reseñado libros</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {resenasAmigos.map((r) => (
                                <ResenaCard key={r.idresena} resena={r} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Reseñas populares */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold text-dark-text mb-5">Reseñas populares</h2>
                {resenasPopulares.length === 0 ? (
                    <div className="text-center py-8 bg-dark-card rounded-2xl">
                        <p className="text-dark-muted">No hay reseñas populares este mes</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {resenasPopulares.map((r) => (
                            <ResenaCard key={r.idresena} resena={r} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}