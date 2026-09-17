import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'

const TITULOS = {
    PENDIENTE: 'Quiero leer',
    LEYENDO: 'Leyendo',
    LEIDO: 'Leídos',
    ABANDONADO: 'Abandonados',
}

export default function EstanteriaCompleta() {
    const { idusuario, estado } = useParams()
    const [libros, setLibros] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { cargarLibros() }, [idusuario, estado])

    const cargarLibros = async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${idusuario}/estado/${estado}`)
            setLibros(res.data || [])
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-dark-text tracking-tight">{TITULOS[estado] || estado}</h1>
                <span className="text-dark-muted text-sm">{libros.length} libros</span>
            </div>

            {libros.length === 0 ? (
                <div className="text-center py-16 bg-dark-card rounded-2xl">
                    <p className="text-dark-muted">No hay libros en esta sección</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-6">
                    {libros.map((s) => (
                        <Link key={s.idseguimiento} to={`/libro/${s.idlibro}`} className="group">
                            {s.portadaLibro ? (
                                <img src={s.portadaLibro} alt={s.tituloLibro}
                                     className="w-full h-56 object-cover rounded-sm shadow-md group-hover:shadow-xl transition-shadow" />
                            ) : (
                                <div className="w-full h-56 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted text-sm shadow-md">
                                    Sin portada
                                </div>
                            )}
                            <p className="text-xs text-dark-text truncate mt-2 group-hover:text-terra transition-colors">{s.tituloLibro}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}