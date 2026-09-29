import { useState } from 'react'
import { Link } from 'react-router-dom'
import SpoilerOculto from './SpoilerOculto'
import api from '../api/axios'

function IconoGuardar({ lleno }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" strokeWidth={2}
             fill={lleno ? 'currentColor' : 'none'} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
    )
}

function IconoLike({ lleno }) {
    return lleno ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    )
}

/**
 * Tarjeta de una cita (muro de citas y pestaña "Mural de citas" del perfil).
 * El like lo gestiona la propia tarjeta; guardar lo decide la página (en tu mural, quitarla la saca de la lista).
 */
export default function TarjetaCita({ cita, esMia, onGuardar }) {
    const [likeada, setLikeada] = useState(!!cita.likeada)
    const [likes, setLikes] = useState(cita.likes || 0)

    const toggleLike = async () => {
        try {
            if (likeada) await api.delete(`/citas/${cita.idanotacion}/like`)
            else await api.post(`/citas/${cita.idanotacion}/like`)
            setLikes(n => likeada ? Math.max(n - 1, 0) : n + 1)
            setLikeada(!likeada)
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    return (
        <article className="bg-dark-card rounded-2xl p-6 flex flex-col break-inside-avoid mb-4">
            <div className="flex items-start justify-between">
                <span aria-hidden className="text-terra/40 text-6xl font-serif leading-none -mb-4 select-none">“</span>
                <div className="flex items-center gap-4">
                    <button onClick={toggleLike} title={likeada ? 'Quitar me gusta' : 'Me gusta'}
                            className={`flex items-center gap-1 transition-colors ${likeada ? 'text-red-500' : 'text-dark-muted hover:text-red-500'}`}>
                        <IconoLike lleno={likeada} />
                        <span className="text-xs tabular-nums">{likes}</span>
                    </button>
                    <button onClick={() => onGuardar(cita)} title={cita.guardada ? 'Quitar de tu mural' : 'Añadir a tu mural'}
                            className={`flex items-center gap-1 transition-colors ${cita.guardada ? 'text-terra' : 'text-dark-muted hover:text-terra'}`}>
                        <IconoGuardar lleno={cita.guardada} />
                        <span className="text-xs tabular-nums">{cita.vecesGuardada || 0}</span>
                    </button>
                </div>
            </div>

            <SpoilerOculto activo={cita.tieneSpoiler && !esMia}>
                <blockquote className="font-serif italic text-dark-text text-lg leading-relaxed whitespace-pre-line">
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
