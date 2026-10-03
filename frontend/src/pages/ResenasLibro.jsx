import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import ResenaCard from '../components/ResenaCard'
import api from '../api/axios'
import { useAvisos } from '../context/AvisosContext'

export default function ResenasLibro() {
    const { avisarCarga } = useAvisos()
    const { id } = useParams()
    const [resenas, setResenas] = useState([])
    const [libro, setLibro] = useState(null)
    const [loading, setLoading] = useState(true)

    const cargarResenas = useCallback(async () => {
        try {
            const res = await api.get(`/resenas/libro/${id}?size=200`)
            setResenas(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar las reseñas.') }
        finally { setLoading(false) }
    }, [avisarCarga, id])

    const cargarLibro = useCallback(async () => {
        try {
            const res = await api.get(`/libros/${id}`)
            setLibro(res.data)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar el libro.') }
    }, [avisarCarga, id])

    useEffect(() => {
        cargarResenas()
        cargarLibro()
    }, [cargarLibro, cargarResenas, id])

    if (loading) return <p className="text-texto-sec">Cargando…</p>

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-serif text-4xl leading-none text-texto">Reseñas</h1>
                    {libro && (
                        <Link to={`/libro/${id}`} className="text-acento hover:text-acento-hover text-sm transition-colors">
                            {libro.titulo}
                        </Link>
                    )}
                </div>
                <span className="text-texto-sec text-sm">{resenas.length} reseñas</span>
            </div>

            {resenas.length === 0 ? (
                <div className="py-6">
                    <p className="font-serif text-xl text-texto-sec mb-3">Nadie ha escrito todavía sobre este libro.</p>
                </div>
            ) : (
                <div className="border-t border-linea">
                    {resenas.map((r) => (
                        <ResenaCard key={r.idresena} resena={r} mostrarLibro={false} />
                    ))}
                </div>
            )}
        </div>
    )
}