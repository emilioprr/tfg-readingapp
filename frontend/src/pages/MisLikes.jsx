import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ResenaCard from '../components/ResenaCard'
import ListaCard from '../components/ListaCard'
import api from '../api/axios'
import Pestanas from '../components/Pestanas'
import { useAvisos } from '../context/AvisosContext'

const PESTANAS = [
    { key: 'resenas', label: 'Reseñas' },
    { key: 'listas', label: 'Listas' },
]

/** Lo que te ha gustado: reseñas y listas. */
export default function MisLikes() {
    const { avisarCarga } = useAvisos()
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
            console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar lo que te gusta.')
        } finally {
            setLoading(false)
        }
    }, [avisarCarga, usuario])

    useEffect(() => { cargarLikes() }, [cargarLikes])

    if (loading) return <p className="text-texto-sec">Cargando…</p>

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-4xl leading-none text-texto mb-4">Lo que me gusta</h1>

            <Pestanas activa={tab} className="mb-6"
                      onCambiar={(k) => setSearchParams(k === 'resenas' ? {} : { tab: k }, { replace: true })}
                      pestanas={PESTANAS.map((t) => ({ key: t.key, label: <>{t.label} <span className="text-texto-sec">({t.key === 'resenas' ? resenas.length : listas.length})</span></> }))} />

            {tab === 'resenas' && (resenas.length === 0 ? (
                <div className="py-6">
                    <p className="font-serif text-xl text-texto-sec mb-3">Todavía no has guardado ninguna reseña que te gustara.</p>
                    <Link to="/resenas" className="text-acento hover:text-acento-hover text-sm transition-colors">Explorar reseñas</Link>
                </div>
            ) : (
                <div className="border-t border-linea">
                    {resenas.map((r) => (
                        <ResenaCard key={r.idresena} resena={r} />
                    ))}
                </div>
            ))}

            {tab === 'listas' && (listas.length === 0 ? (
                <div className="py-6">
                    <p className="font-serif text-xl text-texto-sec mb-3">Todavía no te ha gustado ninguna lista.</p>
                    <Link to="/listas" className="text-acento hover:text-acento-hover text-sm transition-colors">Explorar listas</Link>
                </div>
            ) : (
                <div className="border-t border-linea">
                    {listas.map((l) => (
                        <ListaCard key={l.idlista} lista={l} />
                    ))}
                </div>
            ))}
        </div>
    )
}
