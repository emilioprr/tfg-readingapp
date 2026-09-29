import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ResenaCard from '../components/ResenaCard'
import ListaCard from '../components/ListaCard'
import api from '../api/axios'

const PESTANAS = [
    { key: 'resenas', label: 'Reseñas' },
    { key: 'listas', label: 'Listas' },
]

/** Lo que te ha gustado: reseñas y listas. */
export default function MisLikes() {
    const { usuario } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const tab = searchParams.get('tab') === 'listas' ? 'listas' : 'resenas'
    const [resenas, setResenas] = useState([])
    const [listas, setListas] = useState([])
    const [loading, setLoading] = useState(true)

    const cargarLikes = useCallback(async () => {
        try {
            const [resResenas, resListas] = await Promise.all([
                api.get(`/resenas/likes/${usuario.id}`),
                api.get(`/listas/likes/${usuario.id}`),
            ])
            setResenas(resResenas.data.content || resResenas.data || [])
            setListas(resListas.data || [])
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setLoading(false)
        }
    }, [usuario])

    useEffect(() => { cargarLikes() }, [cargarLikes])

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text mb-4 tracking-tight">Lo que me gusta</h1>

            <div className="flex gap-2 mb-6 border-b border-dark-border">
                {PESTANAS.map((t) => (
                    <button key={t.key} onClick={() => setSearchParams(t.key === 'resenas' ? {} : { tab: t.key }, { replace: true })}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                                tab === t.key ? 'text-terra' : 'text-dark-muted hover:text-dark-text'}`}>
                        {t.label} <span className="text-dark-muted">({t.key === 'resenas' ? resenas.length : listas.length})</span>
                        {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terra rounded-full" />}
                    </button>
                ))}
            </div>

            {tab === 'resenas' && (resenas.length === 0 ? (
                <div className="text-center py-10 bg-dark-card rounded-2xl">
                    <p className="text-dark-muted mb-2">No has dado like a ninguna reseña</p>
                    <Link to="/resenas" className="text-terra hover:text-terra-hover text-sm transition-colors">Explorar reseñas</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {resenas.map((r) => (
                        <ResenaCard key={r.idresena} resena={r} />
                    ))}
                </div>
            ))}

            {tab === 'listas' && (listas.length === 0 ? (
                <div className="text-center py-10 bg-dark-card rounded-2xl">
                    <p className="text-dark-muted mb-2">No has dado like a ninguna lista</p>
                    <Link to="/listas" className="text-terra hover:text-terra-hover text-sm transition-colors">Explorar listas</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {listas.map((l) => (
                        <ListaCard key={l.idlista} lista={l} />
                    ))}
                </div>
            ))}
        </div>
    )
}
