import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PortadaLibro } from '../components/FilaLibros'
import api from '../api/axios'

const TAMANIO_PAGINA = 24

/** Todos los libros de una categoría del catálogo, con "Cargar más". */
export default function CategoriaCatalogo() {
    const { slug } = useParams()
    const [datos, setDatos] = useState(null)
    const [libros, setLibros] = useState([])
    const [cargando, setCargando] = useState(true)

    const pedir = (pagina) => api.get(`/libros/categoria/${slug}?page=${pagina}&size=${TAMANIO_PAGINA}`)

    useEffect(() => {
        const cargar = async () => {
            setCargando(true)
            try {
                const res = await pedir(0)
                setDatos(res.data)
                setLibros(res.data.libros || [])
            } catch (err) {
                console.error('Error:', err)
                setDatos(null)
            } finally { setCargando(false) }
        }
        cargar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug])

    const cargarMas = async () => {
        try {
            const res = await pedir(datos.pagina + 1)
            setDatos(res.data)
            setLibros(prev => [...prev, ...(res.data.libros || [])])
        } catch (err) { console.error('Error:', err) }
    }

    if (cargando) return <p className="text-dark-muted">Cargando...</p>
    if (!datos) return <p className="text-red-400">Categoría no encontrada</p>

    return (
        <div>
            <Link to="/catalogo" className="text-sm text-dark-muted hover:text-terra transition-colors">‹ Catálogo</Link>
            <div className="flex items-baseline gap-3 mt-2 mb-8">
                <h1 className="text-3xl font-bold text-dark-text tracking-tight">{datos.nombre}</h1>
                <span className="text-dark-muted text-sm">{datos.total} libros</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-7">
                {libros.map((libro) => <PortadaLibro key={libro.idlibro} libro={libro} className="w-full" />)}
            </div>

            {datos.hayMas && (
                <div className="flex justify-center mt-10">
                    <button onClick={cargarMas}
                            className="border border-dark-border hover:border-terra hover:text-terra text-dark-muted px-6 py-2 rounded-lg text-sm transition-colors">
                        Cargar más
                    </button>
                </div>
            )}
        </div>
    )
}
