import { useRef, useState, useEffect, useCallback } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

/**
 * Fila horizontal de cinco en cinco, alineada con una rejilla de 5 columnas.
 * Se avanza con las flechas de la cabecera (sin barra de desplazamiento visible).
 *
 * titulo: nodo de la cabecera (a la izquierda de las flechas)
 * children: los elementos; cada uno ocupa una columna
 */
export default function Carrusel({ titulo, children }) {
    const pista = useRef(null)
    const [puede, setPuede] = useState({ izq: false, der: false })

    const medir = useCallback(() => {
        const el = pista.current
        if (!el) return
        setPuede({ izq: el.scrollLeft > 4, der: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
    }, [])

    useEffect(() => {
        medir()
        window.addEventListener('resize', medir)
        return () => window.removeEventListener('resize', medir)
    }, [medir, children])

    const mover = (dir) => {
        const el = pista.current
        if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
    }

    const claseFlecha = 'w-8 h-8 rounded-full border border-linea flex items-center justify-center text-texto-sec hover:text-texto hover:border-texto-ter disabled:opacity-30 disabled:pointer-events-none'

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                {titulo}
                {(puede.izq || puede.der) && (
                    <div className="flex gap-2">
                        <button onClick={() => mover(-1)} disabled={!puede.izq} className={claseFlecha} aria-label="Anteriores"><CaretLeft size={14} /></button>
                        <button onClick={() => mover(1)} disabled={!puede.der} className={claseFlecha} aria-label="Siguientes"><CaretRight size={14} /></button>
                    </div>
                )}
            </div>
            <div ref={pista} onScroll={medir}
                 className="grid grid-flow-col [--g:0.75rem] sm:[--g:1.25rem] gap-[var(--g)] auto-cols-[calc((100%-4*var(--g))/5)] overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-1">
                {children}
            </div>
        </div>
    )
}
