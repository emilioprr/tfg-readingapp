import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import LibroCard from '../components/LibroCard'
import FilaLibros from '../components/FilaLibros'
import api from '../api/axios'

/** Libro destacado en grande, con la portada difuminada de fondo. */
function Destacado({ libro }) {
    return (
        <section className="relative overflow-hidden rounded-2xl mb-10 bg-dark-card">
            {libro.portada && (
                <img src={libro.portada} alt="" aria-hidden
                     className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-dark-base via-dark-base/85 to-dark-base/30" />

            <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 p-6 sm:p-10 items-start sm:items-center">
                <Link to={`/libro/${libro.idlibro}`} className="flex-shrink-0">
                    <img src={libro.portada} alt={libro.titulo}
                         className="w-32 sm:w-44 aspect-[2/3] object-cover rounded-md shadow-2xl hover:scale-[1.02] transition-transform" />
                </Link>
                <div className="min-w-0 max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.2em] text-terra font-semibold mb-2">Recomendado para hoy</p>
                    <h2 className="text-2xl sm:text-4xl font-bold text-dark-text tracking-tight leading-tight">{libro.titulo}</h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-dark-muted">
                        <span className="text-dark-text/90">{libro.nombreAutor}</span>
                        {libro.anioPublicacion && <><span>·</span><span>{libro.anioPublicacion}</span></>}
                        {libro.categoria && <><span>·</span><span>{libro.categoria}</span></>}
                        {libro.notaMedia != null && <><span>·</span><span className="text-amber-400 font-semibold">★ {libro.notaMedia.toLocaleString('es-ES')}</span></>}
                    </div>
                    {libro.sinopsis && (
                        <p className="text-dark-text/80 text-sm leading-relaxed mt-4 line-clamp-4">{libro.sinopsis}</p>
                    )}
                    <Link to={`/libro/${libro.idlibro}`}
                          className="inline-block mt-6 bg-terra hover:bg-terra-hover text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
                        Ver libro
                    </Link>
                </div>
            </div>
        </section>
    )
}

function Esqueleto() {
    return (
        <div className="animate-pulse">
            <div className="h-72 bg-dark-card rounded-2xl mb-10" />
            {[0, 1, 2].map((i) => (
                <div key={i} className="mb-10">
                    <div className="h-5 w-48 bg-dark-card rounded mb-3" />
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 8 }).map((_, j) => <div key={j} className="w-36 aspect-[2/3] bg-dark-card rounded-md flex-shrink-0" />)}
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
                <h1 className="text-2xl font-bold text-dark-text mb-2 tracking-tight">Libros</h1>
                <h2 className="text-lg font-semibold text-dark-muted mb-6">Resultados para "{query}"</h2>
                {cargando ? <p className="text-dark-muted">Buscando...</p> : resultados.length === 0 ? (
                    <p className="text-dark-muted">No se encontraron libros</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
                        {resultados.map((libro) => <LibroCard key={libro.idlibro} libro={libro} className="w-full" />)}
                    </div>
                )}
            </div>
        )
    }

    if (cargando) return <Esqueleto />
    if (!catalogo) return <p className="text-dark-muted">No se ha podido cargar el catálogo</p>

    return (
        <div>
            {catalogo.destacado && <Destacado libro={catalogo.destacado} />}

            {/* Categorías */}
            {catalogo.categorias?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none mb-10 -mx-1 px-1">
                    {catalogo.categorias.map((c) => (
                        <Link key={c.slug} to={`/catalogo/categoria/${c.slug}`}
                              className="flex-shrink-0 border border-dark-border hover:border-terra hover:text-terra text-dark-muted text-sm px-4 py-1.5 rounded-full transition-colors">
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
