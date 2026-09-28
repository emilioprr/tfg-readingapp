import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/** Portada de libro para el catálogo: se agranda al pasar el ratón y muestra la nota si la tiene. */
export function PortadaLibro({ libro, className = 'w-36' }) {
    return (
        <Link to={`/libro/${libro.idlibro}`} className={`group flex-shrink-0 snap-start ${className}`}>
            <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-dark-elevated shadow-md transition-transform duration-300 group-hover:scale-[1.04] group-hover:shadow-2xl">
                {libro.portada ? (
                    <img src={libro.portada} alt={libro.titulo} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col justify-end p-3 bg-gradient-to-br from-dark-elevated to-dark-border">
                        <p className="text-dark-text text-sm font-semibold leading-snug line-clamp-4">{libro.titulo}</p>
                        <p className="text-dark-muted text-xs mt-1 truncate">{libro.nombreAutor}</p>
                    </div>
                )}
                {libro.notaMedia != null && (
                    <span className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-amber-400 text-[11px] font-semibold px-1.5 py-0.5 rounded">
                        ★ {libro.notaMedia}
                    </span>
                )}
            </div>
            <p className="text-sm text-dark-text mt-2 truncate group-hover:text-terra transition-colors">{libro.titulo}</p>
            <p className="text-xs text-dark-muted truncate">{libro.nombreAutor}</p>
        </Link>
    )
}

function Flecha({ direccion, onClick }) {
    const izquierda = direccion === 'izquierda'
    return (
        <button onClick={onClick} aria-label={izquierda ? 'Anteriores' : 'Siguientes'}
                className={`hidden md:flex absolute top-0 ${izquierda ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'} from-dark-base via-dark-base/80 to-transparent
                            h-[calc(100%-2.75rem)] w-14 items-center ${izquierda ? 'justify-start pl-1' : 'justify-end pr-1'}
                            opacity-0 group-hover/fila:opacity-100 transition-opacity z-10 text-dark-text hover:text-terra`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={izquierda ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
            </svg>
        </button>
    )
}

/** Fila horizontal estilo Netflix, con flechas para desplazarse de "página" en "página". */
export default function FilaLibros({ titulo, libros, verTodo }) {
    const scrollRef = useRef(null)
    const [puedeIzquierda, setPuedeIzquierda] = useState(false)
    const [puedeDerecha, setPuedeDerecha] = useState(false)

    const actualizarFlechas = () => {
        const el = scrollRef.current
        if (!el) return
        setPuedeIzquierda(el.scrollLeft > 4)
        setPuedeDerecha(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }

    useEffect(() => {
        actualizarFlechas()
        window.addEventListener('resize', actualizarFlechas)
        return () => window.removeEventListener('resize', actualizarFlechas)
    }, [libros])

    const desplazar = (sentido) => {
        const el = scrollRef.current
        el.scrollBy({ left: sentido * el.clientWidth * 0.85, behavior: 'smooth' })
    }

    return (
        <section className="mb-10">
            <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg font-semibold text-dark-text">{titulo}</h2>
                {verTodo && (
                    <Link to={verTodo} className="text-xs text-dark-muted hover:text-terra transition-colors">
                        Ver todo ›
                    </Link>
                )}
            </div>
            <div className="relative group/fila">
                {puedeIzquierda && <Flecha direccion="izquierda" onClick={() => desplazar(-1)} />}
                <div ref={scrollRef} onScroll={actualizarFlechas}
                     className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pt-1 pb-2 -mx-1 px-1">
                    {libros.map((libro) => <PortadaLibro key={libro.idlibro} libro={libro} />)}
                </div>
                {puedeDerecha && <Flecha direccion="derecha" onClick={() => desplazar(1)} />}
            </div>
        </section>
    )
}
