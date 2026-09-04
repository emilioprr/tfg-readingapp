import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
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
                    <Link to="/catalogo" className="text-terra hover:text-terra-hover text-sm transition-colors">Explorar libros y reseñas</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {resenas.map((r) => (
                        <div key={r.idresena} className="bg-dark-card p-5 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Link to={`/usuario/${r.idusuario}`} className="text-terra font-medium hover:text-terra-hover transition-colors">
                                        {r.nombreUsuario}
                                    </Link>
                                    <span className="text-dark-muted text-sm">sobre</span>
                                    <Link to={`/libro/${r.idlibro}`} className="text-dark-text font-medium hover:text-terra transition-colors">
                                        {r.tituloLibro}
                                    </Link>
                                </div>
                                <Estrellas puntuacion={r.puntuacion} />
                            </div>
                            {r.tieneSpoiler ? (
                                <p className="text-dark-muted italic">Contiene spoilers</p>
                            ) : (
                                <p className="text-dark-text/80">{r.texto}</p>
                            )}
                            {r.etiquetas?.length > 0 && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {r.etiquetas.map((et) => (
                                        <span key={et} className="text-xs bg-terra/10 text-terra px-2.5 py-1 rounded-full">{et}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}