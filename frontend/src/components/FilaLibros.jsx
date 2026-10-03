import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import Portada from './Portada'
import { formatoMedia } from '../utils/notas'

/** Libro del catálogo: portada, título, autor y la nota media si la tiene. */
export function PortadaLibro({ libro, className = 'w-36' }) {
    return (
        <Link to={`/libro/${libro.idlibro}`} className={`group flex-shrink-0 snap-start ${className}`}>
            <Portada src={libro.portada} titulo={libro.titulo} autor={libro.nombreAutor} id={libro.idlibro} className="w-full" />
            <p className="font-serif text-[15px] leading-snug text-texto mt-3 line-clamp-2 group-hover:text-acento">{libro.titulo}</p>
            <p className="flex items-baseline justify-between gap-2 text-xs text-texto-sec mt-0.5">
                <span className="truncate">{libro.nombreAutor}</span>
                {libro.notaMedia != null && (
                    <span className="flex-shrink-0 tabular-nums text-texto-ter">★ {formatoMedia(libro.notaMedia)}</span>
                )}
            </p>
        </Link>
    )
}

const claseFlecha = 'w-8 h-8 rounded-full border border-linea flex items-center justify-center text-texto-sec hover:text-texto hover:border-texto-ter disabled:opacity-30 disabled:pointer-events-none'

/** Fila horizontal de libros; se avanza de "página" en "página" con las flechas de la cabecera. */
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
        <section className="border-t border-linea pt-8 mb-12">
            <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="etiqueta">{titulo}</h2>
                <div className="flex items-center gap-4">
                    {verTodo && (
                        <Link to={verTodo} className="text-xs text-texto-sec hover:text-acento">Ver todo</Link>
                    )}
                    {(puedeIzquierda || puedeDerecha) && (
                        <div className="hidden sm:flex gap-2">
                            <button onClick={() => desplazar(-1)} disabled={!puedeIzquierda} className={claseFlecha} aria-label="Anteriores"><CaretLeft size={14} /></button>
                            <button onClick={() => desplazar(1)} disabled={!puedeDerecha} className={claseFlecha} aria-label="Siguientes"><CaretRight size={14} /></button>
                        </div>
                    )}
                </div>
            </div>
            <div ref={scrollRef} onScroll={actualizarFlechas}
                 className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory pt-1 pb-2">
                {libros.map((libro) => <PortadaLibro key={libro.idlibro} libro={libro} className="w-32 sm:w-36" />)}
            </div>
        </section>
    )
}
