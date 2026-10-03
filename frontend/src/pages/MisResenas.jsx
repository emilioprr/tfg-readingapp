import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import ResenaCard from '../components/ResenaCard'
import api from '../api/axios'
import { useAvisos } from '../context/AvisosContext'

export default function MisResenas() {
    const { avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const [resenas, setResenas] = useState([])
    const [loading, setLoading] = useState(true)

    const cargarResenas = useCallback(async () => {
        try {
            const res = await api.get(`/resenas/usuario/${usuario.id}?size=50`)
            setResenas(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error:', err); avisarCarga(err, 'No se han podido cargar tus reseñas.')
        } finally {
            setLoading(false)
        }
    }, [avisarCarga, usuario])

    useEffect(() => { cargarResenas() }, [cargarResenas])

    if (loading) return <p className="text-texto-sec">Cargando…</p>

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-4xl leading-none text-texto mb-6">Mis reseñas</h1>
            {resenas.length === 0 ? (
                <div className="py-6">
                    <p className="font-serif text-xl text-texto-sec mb-3">Todavía no has escrito ninguna reseña.</p>
                </div>
            ) : (
                <div className="border-t border-linea">
                    {resenas.map((r) => (
                        <ResenaCard key={r.idresena} resena={r} mostrarUsuario={false} />
                    ))}
                </div>
            )}
        </div>
    )
}