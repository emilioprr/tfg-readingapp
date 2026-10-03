import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import LibroCard from '../components/LibroCard'
import FilaLibros from '../components/FilaLibros'
import api from '../api/axios'
import Portada from '../components/Portada'
import { formatoMedia } from '../utils/notas'

/** Libro destacado del día: portada, datos y sinopsis, sobre el fondo liso. */
function Destacado({ libro }) {
    return (
        <section className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start mb-12">
            <Link to={`/libro/${libro.idlibro}`} className="group flex-shrink-0">
                <Portada src={libro.portada} titulo={libro.titulo} autor={libro.nombreAutor} id={libro.idlibro} className="w-32 sm:w-44" />
            </Link>
            <div className="min-w-0 max-w-2xl">
                <p className="etiqueta mb-3">Recomendado para hoy</p>
                <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-tight text-texto">{libro.titulo}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm text-texto-sec">
                    <span className="text-texto/90">{libro.nombreAutor}</span>
                    {libro.anioPublicacion && <><span className="text-texto-ter">·</span><span>{libro.anioPublicacion}</span></>}
                    {libro.categoria && <><span className="text-texto-ter">·</span><span>{libro.categoria}</span></>}
                    {libro.notaMedia != null && <><span className="text-texto-ter">·</span><span className="text-texto tabular-nums">★ {formatoMedia(libro.notaMedia)}</span></>}
                </div>
                {libro.sinopsis && (
                    <p className="font-serif text-texto/85 text-[17px] leading-[1.65] mt-5 line-clamp-4">{libro.sinopsis}</p>
                )}
                <Link to={`/libro/${libro.idlibro}`} className="btn-acento mt-6">Ver libro</Link>
            </div>
        </section>
    )
}

function Esqueleto() {
    return (
        <div className="animate-pulse">
            <div className="flex gap-10 mb-12">
                <div className="w-44 aspect-[2/3] bg-superficie rounded-[2px]" />
                <div className="flex-1 space-y-4 pt-2"><div className="h-3 w-32 bg-superficie" /><div className="h-10 w-2/3 bg-superficie" /><div className="h-4 w-1/3 bg-superficie" /></div>
            </div>
            {[0, 1].map((i) => (
                <div key={i} className="border-t border-linea pt-8 mb-12">
                    <div className="h-3 w-40 bg-superficie mb-6" />
                    <div className="flex gap-6 overflow-hidden">
                        {Array.from({ length: 8 }).map((_, j) => <div key={j} className="w-36 aspect-[2/3] bg-superficie rounded-[2px] flex-shrink-0" />)}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function Catalogo() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''

    const [catalogo, setCatalogo] = useState(null)
    const [resultados, setResultados] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const cargar = async () => {
            setCargando(true)
            try {
                if (query) {
                    const res = await api.get(`/libros/buscar?titulo=${encodeURIComponent(query)}&size=24`)
                    setResultados(res.data.content || res.data || [])
                } else {
                    const res = await api.get('/libros/catalogo')
                    setCatalogo(res.data)
                }
            } catch (err) { console.error('Error:', err) }
            finally { setCargando(false) }
        }
        cargar()
    }, [query])

    if (query) {
        return (
            <div>
                <p className="etiqueta mb-2">Libros</p>
                <h1 className="font-serif text-4xl text-texto mb-10">«{query}»</h1>
                {cargando ? <p className="text-texto-sec">Buscando…</p> : resultados.length === 0 ? (
                    <p className="font-serif text-xl text-texto-sec">Ningún libro coincide con «{query}».</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
                        {resultados.map((libro) => <LibroCard key={libro.idlibro} libro={libro} className="w-full" />)}
                    </div>
                )}
            </div>
        )
    }

    if (cargando) return <Esqueleto />
    if (!catalogo) return <p className="text-texto-sec">No se ha podido cargar el catálogo</p>

    return (
        <div>
            {catalogo.destacado && <Destacado libro={catalogo.destacado} />}

            {/* Categorías */}
            {catalogo.categorias?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-10">
                    {catalogo.categorias.map((c) => (
                        <Link key={c.slug} to={`/catalogo/categoria/${c.slug}`}
                              className="flex-shrink-0 border border-linea hover:border-texto-ter hover:text-texto text-texto-sec text-sm px-3 py-1.5 rounded">
                            {c.nombre}
                        </Link>
                    ))}
                </div>
            )}

            {catalogo.filas.map((fila) => (
                <FilaLibros key={fila.clave} titulo={fila.titulo} libros={fila.libros}
                            verTodo={fila.slugCategoria ? `/catalogo/categoria/${fila.slugCategoria}` : null} />
            ))}
        </div>
    )
}
