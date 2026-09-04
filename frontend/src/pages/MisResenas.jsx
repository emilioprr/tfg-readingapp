import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
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
                <p className="text-dark-muted">No has escrito reseñas todavía</p>
            ) : (
                <div className="space-y-4">
                    {resenas.map((r) => (
                        <div key={r.idresena} className="bg-dark-card p-5 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <Link to={`/libro/${r.idlibro}`} className="text-terra font-medium hover:text-terra-hover transition-colors">
                                    {r.tituloLibro}
                                </Link>
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
                            <div className="flex gap-4 mt-3 text-xs text-dark-muted">
                                <span>{new Date(r.fechaCreacion).toLocaleDateString()}</span>
                                <span>{r.esPublica ? 'Pública' : 'Privada'}</span>
                                <span>{r.numLikes || 0} likes</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}