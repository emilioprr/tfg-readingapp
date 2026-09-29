import { Link } from 'react-router-dom'
import SpoilerOculto from './SpoilerOculto'

function IconoGuardar({ lleno }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth={2}
             fill={lleno ? 'currentColor' : 'none'} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
    )
}

/** Tarjeta de una cita (muro de citas y pestaña "Citas" del perfil). */
export default function TarjetaCita({ cita, esMia, onGuardar }) {
    return (
        <article className="relative bg-dark-card rounded-2xl p-6 flex flex-col break-inside-avoid mb-4">
            <button onClick={() => onGuardar(cita)} title={cita.guardada ? 'Quitar de tu mural' : 'Añadir a tu mural'}
                    className={`absolute top-4 right-4 transition-colors ${cita.guardada ? 'text-terra' : 'text-dark-muted hover:text-terra'}`}>
                <IconoGuardar lleno={cita.guardada} />
            </button>

            <span aria-hidden className="text-terra/40 text-6xl font-serif leading-none -mb-4 select-none">“</span>
            <SpoilerOculto activo={cita.tieneSpoiler && !esMia}>
                <blockquote className="font-serif italic text-dark-text text-lg leading-relaxed whitespace-pre-line pr-6">
                    {cita.texto}
                </blockquote>
            </SpoilerOculto>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-dark-border">
                <Link to={`/libro/${cita.idlibro}`} className="flex-shrink-0">
                    {cita.portadaLibro ? (
                        <img src={cita.portadaLibro} alt={cita.tituloLibro} className="w-9 h-14 object-cover rounded-sm" />
                    ) : (
                        <div className="w-9 h-14 bg-dark-elevated rounded-sm" />
                    )}
                </Link>
                <div className="min-w-0 flex-1">
                    <Link to={`/libro/${cita.idlibro}`} className="text-dark-text text-sm font-medium hover:text-terra transition-colors block truncate">
                        {cita.tituloLibro}
                    </Link>
                    <p className="text-dark-muted text-xs truncate">
                        {cita.nombreAutor}{cita.parte && <> · {cita.parte}</>}
                    </p>
                </div>
                <Link to={`/usuario/${cita.idusuario}`} className="flex items-center gap-1.5 flex-shrink-0 group" title={`Compartida por ${cita.nombreUsuario}`}>
                    {cita.avatarUsuario ? (
                        <img src={cita.avatarUsuario} alt={cita.nombreUsuario} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                        <div className="w-5 h-5 bg-terra/20 rounded-full flex items-center justify-center text-terra text-[10px] font-bold">
                            {cita.nombreUsuario?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="text-dark-muted text-xs group-hover:text-terra transition-colors">{cita.nombreUsuario}</span>
                </Link>
            </div>
        </article>
    )
}
