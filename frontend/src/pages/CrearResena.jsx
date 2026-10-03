import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Lightning, X } from '@phosphor-icons/react'
import Portada from '../components/Portada'
import { FRASES_RITMO } from '../utils/ritmo'
import { ETIQUETAS, nombreEtiqueta } from '../utils/etiquetas'
import { useAvisos } from '../context/AvisosContext'

export default function CrearResena() {
    const { avisarCarga } = useAvisos()
    const { idlibro } = useParams()
    const [searchParams] = useSearchParams()
    const idresena = searchParams.get('editar')
    const esEdicion = !!idresena
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [libro, setLibro] = useState(null)
    const [texto, setTexto] = useState('')
    const [puntuacion, setPuntuacion] = useState(0)
    const [hoverPuntuacion, setHoverPuntuacion] = useState(0)
    const [bloqueadoEstrellas, setBloqueadoEstrellas] = useState(false)
    const [ritmo, setRitmo] = useState(0)
    const [hoverRitmo, setHoverRitmo] = useState(0)
    const [bloqueadoRitmo, setBloqueadoRitmo] = useState(false)
    const [etiquetas, setEtiquetas] = useState([])
    const [esPublica, setEsPublica] = useState(true)
    const [tieneSpoiler, setTieneSpoiler] = useState(false)
    const [leidoPreviamente, setLeidoPreviamente] = useState(false)
    const [error, setError] = useState('')

    const cargarLibro = useCallback(async () => {
        try { const res = await api.get(`/libros/${idlibro}`); setLibro(res.data) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar el libro.') }
    }, [avisarCarga, idlibro])

    const cargarResena = useCallback(async () => {
        try {
            const res = await api.get(`/resenas/${idresena}`)
            const r = res.data
            setTexto(r.texto || '')
            setPuntuacion(r.puntuacion || 0)
            setBloqueadoEstrellas(true)
            setRitmo(r.ritmo || 0)
            setBloqueadoRitmo(r.ritmo > 0)
            setEtiquetas(r.etiquetas || [])
            setEsPublica(r.esPublica)
            setTieneSpoiler(r.tieneSpoiler)
            setLeidoPreviamente(r.leidopreviamente || false)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar la reseña para editarla.') }
    }, [avisarCarga, idresena])

    // Si ya lo había puntuado desde la ficha (sin reseña), se parte de esa nota: al publicar pasa a la reseña
    const cargarValoracion = useCallback(async () => {
        try {
            const res = await api.get(`/valoraciones/libro/${idlibro}/mia`)
            if (res.status === 200 && res.data?.puntuacion) {
                setPuntuacion(Number(res.data.puntuacion))
                setBloqueadoEstrellas(true)
            }
        } catch (err) { console.error('Error:', err) }
    }, [idlibro])

    useEffect(() => { cargarLibro() }, [cargarLibro, idlibro])
    useEffect(() => { if (esEdicion) cargarResena(); else cargarValoracion() }, [cargarResena, cargarValoracion, esEdicion, idresena])

    // Al terminar un libro se puede dejar solo la nota, sin escribir la reseña
    const soloPuntuar = async () => {
        setError('')
        if (puntuacion === 0) { setError('Elige una puntuación'); return }
        try {
            await api.put(`/valoraciones/libro/${idlibro}`, { puntuacion })
            navigate(`/libro/${idlibro}`)
        } catch (err) { setError(err.response?.data?.mensaje || 'Error al guardar la puntuación') }
    }

    const toggleEtiqueta = (et) => { setEtiquetas(prev => prev.includes(et) ? prev.filter(e => e !== et) : [...prev, et]) }

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('')
        if (puntuacion === 0) { setError('La puntuación es obligatoria'); return }
        if (ritmo === 0) { setError('El ritmo es obligatorio'); return }
        try {
            if (esEdicion) {
                await api.put(`/resenas/${idresena}`, { texto, puntuacion, ritmo, etiquetas, esPublica, tieneSpoiler })
                navigate(`/resena/${idresena}`)
            } else {
                await api.post('/resenas', { texto, puntuacion, ritmo, etiquetas, esPublica, tieneSpoiler, leidopreviamente: leidoPreviamente, idlibro: parseInt(idlibro), idusuario: usuario.id })
                navigate(`/libro/${idlibro}`)
            }
        } catch (err) { setError(err.response?.data?.mensaje || (esEdicion ? 'Error al actualizar' : 'Error al crear la reseña')) }
    }

    const handleClickEstrella = (estrella, esMitadIzquierda) => {
        const valor = esMitadIzquierda ? estrella - 0.5 : estrella
        if (bloqueadoEstrellas && valor === puntuacion) setBloqueadoEstrellas(false)
        else { setPuntuacion(valor); setBloqueadoEstrellas(true) }
    }
    const handleHoverEstrella = (estrella, esMitadIzquierda) => {
        if (!bloqueadoEstrellas) setHoverPuntuacion(esMitadIzquierda ? estrella - 0.5 : estrella)
    }
    // Con el teclado: flechas de media en media estrella, Inicio y Fin a los extremos
    const teclaEstrellas = (e) => {
        const pasos = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }
        let valor = null
        if (e.key in pasos) valor = Math.min(5, Math.max(0.5, (puntuacion || 0) + pasos[e.key]))
        else if (e.key === 'Home') valor = 0.5
        else if (e.key === 'End') valor = 5
        if (valor == null) return
        e.preventDefault()
        setPuntuacion(valor); setBloqueadoEstrellas(true); setHoverPuntuacion(0)
    }
    const renderEstrellas = () => {
        const activa = bloqueadoEstrellas ? puntuacion : (hoverPuntuacion || puntuacion)
        return [1, 2, 3, 4, 5].map((estrella) => {
            let fill = 'empty'
            if (activa >= estrella) fill = 'full'
            else if (activa >= estrella - 0.5) fill = 'half'
            return (
                <span key={estrella} className="relative cursor-pointer text-3xl select-none" onMouseLeave={() => { if (!bloqueadoEstrellas) setHoverPuntuacion(0) }}>
          <span className="absolute inset-0 w-1/2 overflow-hidden z-10" onClick={() => handleClickEstrella(estrella, true)} onMouseEnter={() => handleHoverEstrella(estrella, true)} />
          <span className="absolute inset-0 left-1/2 w-1/2 z-10" onClick={() => handleClickEstrella(estrella, false)} onMouseEnter={() => handleHoverEstrella(estrella, false)} />
                    {fill === 'full' && <span className="text-acento">★</span>}
                    {fill === 'half' && <span className="relative"><span className="text-texto-ter">★</span><span className="absolute inset-0 overflow-hidden w-1/2 text-acento">★</span></span>}
                    {fill === 'empty' && <span className="text-texto-ter">★</span>}
        </span>
            )
        })
    }
    const handleClickRayo = (valor) => {
        if (bloqueadoRitmo && valor === ritmo) setBloqueadoRitmo(false)
        else { setRitmo(valor); setBloqueadoRitmo(true) }
    }
    const handleHoverRayo = (valor) => { if (!bloqueadoRitmo) setHoverRitmo(valor) }
    const renderRayos = () => {
        const activo = bloqueadoRitmo ? ritmo : (hoverRitmo || ritmo)
        return [1, 2, 3].map((r) => (
            <button key={r} type="button" onClick={() => handleClickRayo(r)} onMouseEnter={() => handleHoverRayo(r)}
                    onMouseLeave={() => { if (!bloqueadoRitmo) setHoverRitmo(0) }}
                    aria-label={`Ritmo ${r} de 3: ${FRASES_RITMO[r].toLowerCase()}`} aria-pressed={ritmo === r}
                    className={`select-none px-1 py-1 rounded text-acento transition-opacity ${activo >= r ? 'opacity-100' : 'opacity-35'}`}>
                <Lightning size={26} weight={activo >= r ? 'fill' : 'light'} />
            </button>
        ))
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-serif text-4xl leading-none text-texto">{esEdicion ? 'Editar reseña' : 'Escribir reseña'}</h1>
                <button onClick={() => navigate(-1)} className="text-texto-sec hover:text-texto" aria-label="Cerrar"><X size={22} /></button>
            </div>
            <div className="flex gap-6">
                {libro && (
                    <div className="flex-shrink-0 hidden sm:block">
                        <Portada src={libro.portada} titulo={libro.titulo} autor={libro.nombreAutor} id={libro.idlibro} elevar={false} className="w-36" />
                    </div>
                )}
                <div className="flex-1">
                    {libro && <div className="mb-6"><h2 className="font-serif text-2xl leading-tight text-texto">{libro.titulo}</h2><p className="text-texto-sec text-sm mt-1">{libro.nombreAutor}</p></div>}
                    {error && <p className="text-error text-sm mb-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="etiqueta block mb-2">Puntuación</label>
                            <div className="flex items-center gap-1">
                                <div role="slider" tabIndex={0} aria-label="Puntuación" aria-valuemin={0.5} aria-valuemax={5} aria-valuenow={puntuacion || undefined}
                                     aria-valuetext={puntuacion ? `${String(puntuacion).replace('.', ',')} de 5 estrellas` : 'Sin puntuar'}
                                     onKeyDown={teclaEstrellas} className="flex items-center gap-1 rounded">{renderEstrellas()}</div>{puntuacion > 0 && <span className="ml-3 font-serif text-2xl text-texto">{String(puntuacion).replace('.', ',')}</span>}</div>
                        </div>
                        <div>
                            <label className="etiqueta block mb-2">Ritmo</label>
                            <div className="flex items-center gap-1">{renderRayos()}{ritmo > 0 && <span className="ml-3 text-texto-sec text-sm">{FRASES_RITMO[ritmo]}</span>}</div>
                        </div>
                        <div>
                            <label className="etiqueta block mb-2">Ambiente</label>
                            <div className="flex flex-wrap gap-2">
                                {ETIQUETAS.map((et) => (
                                    <button key={et} type="button" onClick={() => toggleEtiqueta(et)}
                                            aria-pressed={etiquetas.includes(et)}
                                            className={`text-xs px-2.5 py-1 rounded ${etiquetas.includes(et) ? 'bg-texto text-fondo' : 'border border-linea text-texto-sec hover:text-texto'}`}>{nombreEtiqueta(et)}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="etiqueta block mb-2">Tu reseña</label>
                            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={5}
                                      className="campo font-serif text-[17px] leading-[1.65]" placeholder="¿Qué te ha parecido?" />
                        </div>
                        <div className="flex flex-wrap gap-6">
                            <label className="flex items-center gap-2 text-texto-sec text-sm cursor-pointer"><input type="checkbox" checked={esPublica} onChange={(e) => setEsPublica(e.target.checked)} className="accent-acento" />Pública</label>
                            <label className="flex items-center gap-2 text-texto-sec text-sm cursor-pointer"><input type="checkbox" checked={tieneSpoiler} onChange={(e) => setTieneSpoiler(e.target.checked)} className="accent-acento" />Spoilers</label>
                            {!esEdicion && (
                                <label className="flex items-center gap-2 text-texto-sec text-sm cursor-pointer"><input type="checkbox" checked={leidoPreviamente} onChange={(e) => setLeidoPreviamente(e.target.checked)} className="accent-acento" />Relectura</label>
                            )}
                        </div>
                        <button type="submit" className="w-full btn-acento">
                            {esEdicion ? 'Guardar cambios' : 'Publicar reseña'}
                        </button>
                        {!esEdicion && (
                            <button type="button" onClick={soloPuntuar}
                                    className="w-full -mt-3 btn-secundario">
                                Solo puntuar, sin escribir reseña
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}