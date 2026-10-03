import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAvisos } from '../context/AvisosContext'

const formatoNota = (n) => Number(n).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function Estrellas5({ valor, activas, onElegir }) {
    const [hover, setHover] = useState(0)
    const mostrada = (activas && hover) || valor || 0
    return (
        <div className={`flex items-center justify-center rounded ${activas ? '' : 'opacity-40'}`} onMouseLeave={() => setHover(0)}
             {...(activas && {
                 role: 'slider', tabIndex: 0, 'aria-label': 'Tu nota (flechas para elegir, Enter para guardar)',
                 'aria-valuemin': 0.5, 'aria-valuemax': 5, 'aria-valuenow': mostrada || undefined,
                 'aria-valuetext': mostrada ? `${formatoNota(mostrada)} de 5 estrellas` : 'Sin nota',
                 onBlur: () => setHover(0),
                 onKeyDown: (e) => {
                     const pasos = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }
                     if (e.key in pasos) { e.preventDefault(); setHover(Math.min(5, Math.max(0.5, mostrada + pasos[e.key]))) }
                     else if ((e.key === 'Enter' || e.key === ' ') && mostrada) { e.preventDefault(); onElegir(mostrada); setHover(0) }
                 },
             })}>
            {[1, 2, 3, 4, 5].map((estrella) => {
                const fill = mostrada >= estrella ? 'full' : mostrada >= estrella - 0.5 ? 'half' : 'empty'
                return (
                    <span key={estrella} className={`relative text-3xl leading-none select-none ${activas ? 'cursor-pointer' : ''}`}>
                        {activas && (
                            <>
                                <span className="absolute inset-0 w-1/2 z-10" title={formatoNota(estrella - 0.5)}
                                      onClick={() => onElegir(estrella - 0.5)} onMouseEnter={() => setHover(estrella - 0.5)} />
                                <span className="absolute inset-0 left-1/2 w-1/2 z-10" title={formatoNota(estrella)}
                                      onClick={() => onElegir(estrella)} onMouseEnter={() => setHover(estrella)} />
                            </>
                        )}
                        <span className="text-texto-ter">★</span>
                        {fill !== 'empty' && (
                            <span className={`absolute inset-0 overflow-hidden text-acento ${fill === 'half' ? 'w-1/2' : ''}`}>★</span>
                        )}
                    </span>
                )
            })}
        </div>
    )
}

/**
 * "Tu nota" bajo la portada de un libro, coherente con el ciclo de lectura:
 * - sin leer (o en Quiero leer / Abandonado): puntuarlo lo pasa a tus leídos como "leído hace tiempo";
 * - leyendo: se puntúa al terminar;
 * - leído sin reseña: tu nota, con la opción de escribir la reseña (que parte de esa nota);
 * - con reseña: la nota es la de la reseña y cambiarla aquí la actualiza.
 */
export default function PuntuarLibro({ idlibro, estado, lecturaAntigua, miResena, onCambio }) {
    const { avisar } = useAvisos()
    const [valoracion, setValoracion] = useState(null)
    const [guardando, setGuardando] = useState(false)

    const cargar = useCallback(async () => {
        try {
            const res = await api.get(`/valoraciones/libro/${idlibro}/mia`)
            setValoracion(res.status === 200 && res.data?.puntuacion ? Number(res.data.puntuacion) : null)
        } catch (err) { console.error('Error:', err) }
    }, [idlibro])

    useEffect(() => { cargar() }, [cargar, miResena, estado])

    const guardar = async (accion) => {
        if (guardando) return
        setGuardando(true)
        try { await accion(); onCambio?.() }
        catch (err) { avisar(err.response?.data?.mensaje || 'Error al guardar la nota') }
        finally { setGuardando(false) }
    }

    const elegir = (valor) => guardar(async () => {
        if (miResena) {
            await api.put(`/resenas/${miResena.idresena}`, { puntuacion: valor })
        } else {
            await api.put(`/valoraciones/libro/${idlibro}`, { puntuacion: valor })
            setValoracion(valor)
        }
    })

    const quitar = () => guardar(async () => {
        await api.delete(`/valoraciones/libro/${idlibro}`)
        setValoracion(null)
    })

    const nota = miResena ? Number(miResena.puntuacion) : valoracion
    const leyendo = estado === 'LEYENDO'
    const leido = estado === 'LEIDO'

    let titulo, detalle
    if (leyendo) {
        titulo = nota ? 'Tu nota anterior' : 'Tu nota'
        detalle = <span>Podrás puntuarlo cuando lo termines</span>
    } else if (miResena) {
        titulo = 'Tu nota'
        detalle = <Link to={`/resena/${miResena.idresena}`} className="hover:text-acento transition-colors">Ver tu reseña</Link>
    } else if (leido) {
        titulo = nota ? (lecturaAntigua ? 'Tu nota · leído hace tiempo' : 'Tu nota') : '¿Qué te ha parecido?'
        detalle = (
            <span className="flex items-center justify-center gap-2">
                <Link to={`/libro/${idlibro}/resena`} className="text-acento hover:text-acento-hover transition-colors">Escribir reseña</Link>
                {nota != null && (
                    <>
                        <span aria-hidden>·</span>
                        <button onClick={quitar} className="hover:text-error transition-colors">Quitar nota</button>
                    </>
                )}
            </span>
        )
    } else {
        titulo = '¿Ya lo leíste?'
        detalle = <span>Puntúalo y pasará a tus leídos</span>
    }

    return (
        <div className="w-52 mt-4 text-center">
            <p className="text-xs uppercase tracking-wide text-texto-sec mb-1.5">{titulo}</p>
            <Estrellas5 valor={nota} activas={!leyendo && !guardando} onElegir={elegir} />
            {nota != null && <p className="font-serif text-texto text-lg mt-1">{formatoNota(nota)}</p>}
            <div className="text-xs text-texto-sec mt-1.5">{detalle}</div>
        </div>
    )
}
