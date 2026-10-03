import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PortadaLibro } from '../components/FilaLibros'
import api from '../api/axios'
import { CaretLeft } from '@phosphor-icons/react'
import { useAvisos } from '../context/AvisosContext'

const TAMANIO_PAGINA = 24

/** Todos los libros de una categoría del catálogo, con "Cargar más". */
export default function CategoriaCatalogo() {
    const { avisarCarga } = useAvisos()
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
                console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar la categoría.')
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
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar más libros.') }
    }

    if (cargando) return <p className="text-texto-sec">Cargando…</p>
    if (!datos) return <p className="font-serif text-xl text-texto-sec">Esta categoría no existe o no se ha podido cargar.</p>

    return (
        <div>
            <Link to="/catalogo" className="btn-texto"><CaretLeft size={14} /> Explorar</Link>
            <div className="flex items-baseline gap-4 mt-4 mb-10">
                <h1 className="font-serif text-4xl sm:text-5xl leading-none tracking-tight text-texto">{datos.nombre}</h1>
                <span className="text-texto-ter text-sm tabular-nums">{datos.total} libros</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
                {libros.map((libro) => <PortadaLibro key={libro.idlibro} libro={libro} className="w-full" />)}
            </div>

            {datos.hayMas && (
                <div className="flex justify-center mt-10">
                    <button onClick={cargarMas} className="btn-secundario">
                        Cargar más
                    </button>
                </div>
            )}
        </div>
    )
}
