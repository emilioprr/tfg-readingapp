import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import Balda from '../components/Balda'
import { useAvisos } from '../context/AvisosContext'

const TITULOS = {
    PENDIENTE: 'Quiero leer',
    LEYENDO: 'Leyendo',
    LEIDO: 'Leídos',
    ABANDONADO: 'Abandonados',
}

export default function EstanteriaCompleta() {
    const { avisarCarga } = useAvisos()
    const { idusuario, estado } = useParams()
    const [libros, setLibros] = useState([])
    const [loading, setLoading] = useState(true)

    const cargarLibros = useCallback(async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${idusuario}/estado/${estado}`)
            setLibros(res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar la estantería.') }
        finally { setLoading(false) }
    }, [avisarCarga, estado, idusuario])

    useEffect(() => { cargarLibros() }, [idusuario, estado, cargarLibros])

    if (loading) return <p className="text-texto-sec">Cargando…</p>

    return (
        <div className="max-w-5xl mx-auto">
            <header className="flex items-end justify-between gap-4 mb-10">
                <div>
                    <p className="etiqueta mb-2">Estantería</p>
                    <h1 className="font-serif text-4xl sm:text-5xl leading-none text-texto">{TITULOS[estado] || estado}</h1>
                </div>
                <span className="text-texto-sec text-sm">{libros.length} {libros.length === 1 ? 'libro' : 'libros'}</span>
            </header>

            {libros.length === 0 ? (
                <p className="font-serif text-xl text-texto-sec">Esta balda está vacía de momento.</p>
            ) : (
                <Balda libros={libros.map((s) => ({
                    key: s.idseguimiento, idlibro: s.idlibro, titulo: s.tituloLibro, autor: s.nombreAutor, portada: s.portadaLibro,
                }))} />
            )}
        </div>
    )
}
