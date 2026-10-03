import { Link } from 'react-router-dom'
import Portada from './Portada'

export default function LibroCard({ libro, className = 'w-36' }) {
    return (
        <Link to={`/libro/${libro.idlibro}`} className={`group flex-shrink-0 ${className}`}>
            <Portada src={libro.portada} titulo={libro.titulo} autor={libro.nombreAutor} id={libro.idlibro} className="w-full" />
            <p className="font-serif text-[15px] leading-snug text-texto mt-3 line-clamp-2 group-hover:text-acento">
                {libro.titulo}
            </p>
            <p className="text-xs text-texto-sec truncate mt-0.5">{libro.nombreAutor}</p>
        </Link>
    )
}
