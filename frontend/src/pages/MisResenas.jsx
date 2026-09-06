import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ResenaCard from '../components/ResenaCard'
import api from '../api/axios'

export default function MisResenas() {
    const { usuario } = useAuth()
    const [resenas, setResenas] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { cargarResenas() }, [])

    const cargarResenas = async () => {
        try {
            const res = await api.get(`/resenas/usuario/${usuario.id}?size=50`)
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
            <h1 className="text-2xl font-bold text-dark-text mb-6 tracking-tight">Mis reseñas</h1>
            {resenas.length === 0 ? (
                <div className="text-center py-10 bg-dark-card rounded-2xl">
                    <p className="text-dark-muted">No has escrito reseñas todavía</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {resenas.map((r) => (
                        <ResenaCard key={r.idresena} resena={r} mostrarUsuario={false} />
                    ))}
                </div>
            )}
        </div>
    )
}