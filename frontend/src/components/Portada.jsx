import { useState } from 'react'
import { mejorarPortada } from '../utils/portadas'
import PortadaGenerada from './PortadaGenerada'

/**
 * Portada de un libro con presencia de objeto: proporción 2:3, esquinas de 2 px, sombra fina de lomo
 * a la izquierda y un ligero levantamiento al pasar el ratón (si el contenedor lleva la clase `group`).
 * Sin imagen (o si no carga), muestra una portada generada con el título y el autor.
 */
export default function Portada({ src, titulo, autor, id, className = 'w-32', elevar = true }) {
    const [fallo, setFallo] = useState(false)
    const mover = elevar ? 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1' : ''

    if (!src || fallo) {
        return <PortadaGenerada id={id} titulo={titulo} autor={autor} className={`aspect-[2/3] ${mover} ${className}`} />
    }
    return (
        <div className={`relative aspect-[2/3] overflow-hidden rounded-[2px] bg-superficie ${mover} ${className}`}>
            <img src={mejorarPortada(src)} alt={`Portada de ${titulo || 'libro'}`} loading="lazy"
                 onError={() => setFallo(true)} className="absolute inset-0 w-full h-full object-cover" />
            {/* Lomo: sombra fina en el lado izquierdo, como un libro de verdad */}
            <span aria-hidden className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-fondo/45 to-transparent" />
            <span aria-hidden className="absolute inset-0 rounded-[2px] ring-1 ring-inset ring-texto/5" />
        </div>
    )
}
