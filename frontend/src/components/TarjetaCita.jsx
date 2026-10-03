import { useState } from 'react'
import { Link } from 'react-router-dom'
import SpoilerOculto from './SpoilerOculto'
import api from '../api/axios'
import { Heart, BookmarkSimple } from '@phosphor-icons/react'
import Portada from './Portada'
import { useAvisos } from '../context/AvisosContext'

/**
 * Tarjeta de una cita (muro de citas y pestaña "Mural de citas" del perfil).
 * El like lo gestiona la propia tarjeta; guardar lo decide la página (en tu mural, quitarla la saca de la lista).
 */
export default function TarjetaCita({ cita, esMia, onGuardar }) {
    const { avisar } = useAvisos()
    const [likeada, setLikeada] = useState(!!cita.likeada)
    const [likes, setLikes] = useState(cita.likes || 0)

    const toggleLike = async () => {
        try {
            if (likeada) await api.delete(`/citas/${cita.idanotacion}/like`)
            else await api.post(`/citas/${cita.idanotacion}/like`)
            setLikes(n => likeada ? Math.max(n - 1, 0) : n + 1)
            setLikeada(!likeada)
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    return (
        <article className="break-inside-avoid mb-10 pb-8 border-b border-linea">
            <SpoilerOculto activo={cita.tieneSpoiler && !esMia}>
                {/* La frase, tal cual */}
                <blockquote className="font-serif italic text-texto text-[1.4rem] leading-[1.6] whitespace-pre-line">
                    {cita.texto}
                </blockquote>
            </SpoilerOculto>

            {/* Libro de origen al pie */}
            <div className="flex items-center gap-3 mt-6">
                <Link to={`/libro/${cita.idlibro}`} className="group flex-shrink-0">
                    <Portada src={cita.portadaLibro} titulo={cita.tituloLibro} id={cita.idlibro} className="w-8" />
                </Link>
                <div className="min-w-0 flex-1">
                    <Link to={`/libro/${cita.idlibro}`} className="font-serif text-texto hover:text-acento block truncate">
                        {cita.tituloLibro}
                    </Link>
                    <p className="text-texto-sec text-xs truncate">
                        {cita.nombreAutor}{cita.parte && <> · {cita.parte}</>}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-4 text-xs">
                <Link to={`/usuario/${cita.idusuario}`} className="text-texto-ter hover:text-acento truncate" title={`Compartida por ${cita.nombreUsuario}`}>
                    Subrayada por <span className="text-texto-sec">{cita.nombreUsuario}</span>
                </Link>
                <div className="flex items-center gap-4 flex-shrink-0">
                    <button onClick={toggleLike} title={likeada ? 'Quitar me gusta' : 'Me gusta'} aria-label={likeada ? 'Quitar me gusta' : 'Me gusta'}
                            className={`flex items-center gap-1 ${likeada ? 'text-acento' : 'text-texto-sec hover:text-acento'}`}>
                        <Heart size={16} weight={likeada ? 'fill' : 'regular'} />
                        <span className="tabular-nums">{likes}</span>
                    </button>
                    <button onClick={() => onGuardar(cita)} title={cita.guardada ? 'Quitar de tu mural' : 'Añadir a tu mural'}
                            aria-label={cita.guardada ? 'Quitar de tu mural' : 'Añadir a tu mural'}
                            className={`flex items-center gap-1 ${cita.guardada ? 'text-acento' : 'text-texto-sec hover:text-acento'}`}>
                        <BookmarkSimple size={16} weight={cita.guardada ? 'fill' : 'regular'} />
                        <span className="tabular-nums">{cita.vecesGuardada || 0}</span>
                    </button>
                </div>
            </div>
        </article>
    )
}
