import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import ResenaCard from '../components/ResenaCard'
import api from '../api/axios'
import { useAvisos } from '../context/AvisosContext'

export default function Resenas() {
    const { avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const [resenasAmigos, setResenasAmigos] = useState([])
    const [resenasPopulares, setResenasPopulares] = useState([])
    const [loading, setLoading] = useState(true)
    const [paginaPopulares, setPaginaPopulares] = useState(0)
    const [hayMasPopulares, setHayMasPopulares] = useState(true)
    const [cargandoMas, setCargandoMas] = useState(false)

    const cargarResenasAmigos = useCallback(async () => {
        if (!usuario) { setLoading(false); return }
        try {
            const res = await api.get(`/resenas/seguidos/${usuario.id}?size=20`)
            setResenasAmigos(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar las reseñas de tus amigos.') }
        finally { setLoading(false) }
    }, [avisarCarga, usuario])

    const cargarResenasPopulares = useCallback(async (pagina = 0, acumular = false) => {
        try {
            const res = await api.get(`/resenas/populares?size=20&page=${pagina}`)
            const nuevas = res.data.content || res.data || []
            if (acumular) {
                setResenasPopulares(prev => [...prev, ...nuevas])
            } else {
                setResenasPopulares(nuevas)
            }
            setHayMasPopulares(nuevas.length === 20)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar las reseñas populares.') }
    }, [avisarCarga])

    useEffect(() => {
        cargarResenasAmigos()
        cargarResenasPopulares()
    }, [cargarResenasAmigos, cargarResenasPopulares, usuario])

    const cargarMasPopulares = async () => {
        setCargandoMas(true)
        const siguiente = paginaPopulares + 1
        setPaginaPopulares(siguiente)
        await cargarResenasPopulares(siguiente, true)
        setCargandoMas(false)
    }

    if (loading) return <p className="text-texto-sec">Cargando…</p>

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-4xl leading-none text-texto mb-8">Reseñas</h1>

            {/* Nuevas reseñas de amigos */}
            {usuario && (
                <section className="border-t border-linea pt-8 mb-12">
                    <h2 className="etiqueta mb-2">Nuevas reseñas de amigos</h2>
                    {resenasAmigos.length === 0 ? (
                        <div className="py-6">
                            <p className="font-serif text-xl text-texto-sec mb-3">Las personas que sigues aún no han reseñado nada.</p>
                        </div>
                    ) : (
                        <div>
                            {resenasAmigos.map((r) => (
                                <ResenaCard key={r.idresena} resena={r} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Reseñas populares */}
            <section className="border-t border-linea pt-8 mb-12">
                <h2 className="etiqueta mb-2">Reseñas populares</h2>
                {resenasPopulares.length === 0 ? (
                    <div className="py-6">
                        <p className="font-serif text-xl text-texto-sec mb-3">Este mes todavía nadie ha escrito una reseña que destaque.</p>
                    </div>
                ) : (
                    <>
                        <div>
                            {resenasPopulares.map((r) => (
                                <ResenaCard key={r.idresena} resena={r} />
                            ))}
                        </div>
                        {hayMasPopulares && (
                            <div className="text-center mt-6">
                                <button onClick={cargarMasPopulares} disabled={cargandoMas}
                                        className="btn-secundario">
                                    {cargandoMas ? 'Cargando…' : 'Ver más'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    )
}