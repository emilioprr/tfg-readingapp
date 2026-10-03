import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { NotePencil, Quotes, X } from '@phosphor-icons/react'
import Portada from '../components/Portada'
import { useAvisos } from '../context/AvisosContext'

export default function CrearAnotacion() {
    const { avisar, avisarCarga } = useAvisos()
    const { idlibro } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [libro, setLibro] = useState(null)
    const [anotaciones, setAnotaciones] = useState([])
    const [texto, setTexto] = useState('')
    const [parte, setParte] = useState('')
    const [tipo, setTipo] = useState('NOTA')
    const [esPublica, setEsPublica] = useState(false)
    const [tieneSpoiler, setTieneSpoiler] = useState(false)
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')

    const cargarLibro = useCallback(async () => {
        try { const res = await api.get(`/libros/${idlibro}`); setLibro(res.data) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar el libro.') }
    }, [avisarCarga, idlibro])
    const cargarAnotaciones = useCallback(async () => {
        try { const res = await api.get(`/anotaciones/usuario/${usuario.id}/libro/${idlibro}`); setAnotaciones(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar tus anotaciones.') }
    }, [avisarCarga, idlibro, usuario])

    useEffect(() => { cargarLibro(); cargarAnotaciones() }, [cargarAnotaciones, cargarLibro, idlibro])

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setExito('')
        if (!texto.trim()) { setError('El texto es obligatorio'); return }
        try {
            await api.post('/anotaciones', { texto, parte, tipo, esPublica, tieneSpoiler, idlibro: parseInt(idlibro), idusuario: usuario.id })
            setExito('Anotación guardada'); setTexto(''); setParte(''); cargarAnotaciones()
        } catch (err) { setError(err.response?.data?.mensaje || 'Error al crear anotación') }
        navigate('/')
    }

    const eliminarAnotacion = async (id) => {
        try { await api.delete(`/anotaciones/${id}`); cargarAnotaciones() }
        catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    if (!libro) return <p className="text-texto-sec">Cargando…</p>

    const TIPOS = [
        { valor: 'NOTA', nombre: 'Nota', icono: NotePencil },
        { valor: 'CITA', nombre: 'Cita', icono: Quotes },
    ]

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-start justify-between gap-4 mb-8">
                <div className="flex gap-5 min-w-0">
                    <Portada src={libro.portada} titulo={libro.titulo} autor={libro.nombreAutor} id={libro.idlibro}
                             elevar={false} className="w-20 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="etiqueta mb-2">En los márgenes de</p>
                        <h1 className="font-serif text-3xl sm:text-4xl leading-[1.05] text-texto">{libro.titulo}</h1>
                        <p className="text-texto-sec mt-2">{libro.nombreAutor}</p>
                    </div>
                </div>
                <button onClick={() => navigate(`/`)} className="text-texto-sec hover:text-texto" aria-label="Cerrar">
                    <X size={22} />
                </button>
            </div>
            <p className="text-texto-sec text-sm mb-8 max-w-prose">
                Apunta lo que te hace pensar o una frase que quieras guardar. Si indicas el capítulo o la página, luego la encontrarás enseguida.
            </p>

            {error && <p className="text-error text-sm mb-4">{error}</p>}
            {exito && <p className="text-exito text-sm mb-4">{exito}</p>}

            <form onSubmit={handleSubmit} className="border-y border-linea py-6 mb-10 space-y-5">
                <div className="flex gap-2" role="group" aria-label="Tipo de anotación">
                    {TIPOS.map(({ valor, nombre, icono: Icono }) => (
                        <button key={valor} type="button" onClick={() => setTipo(valor)} aria-pressed={tipo === valor}
                                className={`btn ${tipo === valor ? 'bg-texto text-fondo' : 'border border-linea text-texto-sec hover:text-texto'}`}>
                            <Icono size={16} /> {nombre}
                        </button>
                    ))}
                </div>
                <div>
                    <label htmlFor="parte" className="etiqueta block mb-2">Parte del libro <span className="text-texto-ter normal-case tracking-normal">(opcional)</span></label>
                    <input id="parte" type="text" value={parte} onChange={(e) => setParte(e.target.value)}
                           className="campo" placeholder="Capítulo 3, página 42…" />
                </div>
                <div>
                    <label htmlFor="texto" className="etiqueta block mb-2">{tipo === 'NOTA' ? 'Tu nota' : 'La frase'}</label>
                    <textarea id="texto" value={texto} onChange={(e) => setTexto(e.target.value)} rows={4}
                              className={`campo font-serif text-[17px] leading-[1.6] ${tipo === 'CITA' ? 'italic' : ''}`}
                              placeholder={tipo === 'NOTA' ? 'Lo que te ha hecho pensar…' : 'Copia la frase tal cual…'} required />
                </div>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-texto-sec text-sm cursor-pointer"><input type="checkbox" checked={esPublica} onChange={(e) => setEsPublica(e.target.checked)} className="accent-acento" />Pública</label>
                    <label className="flex items-center gap-2 text-texto-sec text-sm cursor-pointer"><input type="checkbox" checked={tieneSpoiler} onChange={(e) => setTieneSpoiler(e.target.checked)} className="accent-acento" />Tiene spoilers</label>
                </div>
                <button type="submit" className="btn-acento">Guardar anotación</button>
            </form>

            <h2 className="etiqueta mb-4">Tus anotaciones</h2>
            {anotaciones.length === 0 ? <p className="font-serif text-xl text-texto-sec">Todavía no has escrito en los márgenes de este libro.</p> : (
                <div className="divide-y divide-linea border-y border-linea">
                    {anotaciones.map((a) => (
                        <article key={a.idanotacion} className="py-5">
                            <div className="flex items-center justify-between gap-4 mb-2">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-texto-ter">
                                    <span className="flex items-center gap-1 text-texto-sec">
                                        {a.tipo === 'CITA' ? <Quotes size={14} /> : <NotePencil size={14} />}
                                        {a.tipo === 'CITA' ? 'Cita' : 'Nota'}
                                    </span>
                                    {a.parte && <span>· {a.parte}</span>}
                                    {a.tieneSpoiler && <span className="text-acento">· Spoilers</span>}
                                    <span>· {new Date(a.fecha).toLocaleString()}</span>
                                </div>
                                <button onClick={() => eliminarAnotacion(a.idanotacion)} className="text-texto-ter hover:text-error"
                                        aria-label="Eliminar anotación" title="Eliminar">
                                    <X size={14} />
                                </button>
                            </div>
                            {a.tipo === 'CITA' ? (
                                <blockquote className="font-serif italic text-[1.2rem] leading-[1.6] text-texto">
                                    {a.texto}
                                </blockquote>
                            ) : (
                                <p className="font-serif text-[17px] leading-[1.65] text-texto/90 whitespace-pre-line">{a.texto}</p>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
