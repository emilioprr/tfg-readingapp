import { Link } from 'react-router-dom'

export default function LibroCard({ libro, className = 'w-40' }) {
    return (
        <Link to={`/libro/${libro.idlibro}`} className={`group flex-shrink-0 ${className}`}>
            {libro.portada ? (
                <img src={libro.portada} alt={libro.titulo}
                     className="w-full h-56 object-cover rounded-sm shadow-md group-hover:shadow-xl transition-shadow" />
            ) : (
                <div className="w-full h-56 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted text-sm shadow-md">
                    Sin portada
                </div>
            )}
            <p className="text-sm text-dark-text mt-2 truncate group-hover:text-terra transition-colors">
                {libro.titulo}
            </p>
            <p className="text-xs text-dark-muted truncate">{libro.nombreAutor}</p>
        </Link>
    )
}