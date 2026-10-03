import { Link } from 'react-router-dom'
import Portada from './Portada'

/**
 * Libros apoyados en una balda: las portadas se alinean abajo sobre una línea que hace de estante.
 * Si no caben en una fila, bajan a la siguiente balda (cada fila tiene su propio estante).
 *
 * libros: [{ key, idlibro, titulo, autor, portada }]
 * extra(libro): contenido superpuesto opcional (p. ej. el botón de quitar de favoritos)
 */
export default function Balda({ libros, tamano = 'w-24 sm:w-28', extra, huecos = [] }) {
    return (
        <div className="flex flex-wrap items-end gap-y-10">
            {libros.map((l) => (
                <div key={l.key ?? l.idlibro} className="relative px-2.5 sm:px-3 border-b-[3px] border-linea">
                    <Link to={`/libro/${l.idlibro}`} className="group block" title={l.autor ? `${l.titulo} · ${l.autor}` : l.titulo}>
                        <Portada src={l.portada} titulo={l.titulo} autor={l.autor} id={l.idlibro} className={tamano} />
                    </Link>
                    {extra?.(l)}
                </div>
            ))}
            {/* Huecos de la balda (p. ej. favoritos aún sin elegir) */}
            {huecos.map((h, i) => (
                <div key={`hueco-${i}`} className="px-2.5 sm:px-3 border-b-[3px] border-linea">{h}</div>
            ))}
        </div>
    )
}
