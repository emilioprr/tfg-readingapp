import { useState, useEffect, useCallback } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FilaLibros from '../components/FilaLibros'
import ActividadSeguidos from '../components/ActividadSeguidos'
import { useRacha } from '../context/RachaContext'
import { useNotificaciones } from '../context/NotificacionesContext'
import api from '../api/axios'
import { CaretLeft, CaretRight, NotePencil, Check, X } from '@phosphor-icons/react'
import Portada from '../components/Portada'
import ProgresoLectura from '../components/ProgresoLectura'
import Dialogo from '../components/Dialogo'
import { SemanaRacha } from '../components/Racha'
import { useAvisos } from '../context/AvisosContext'

export default function Inicio() {
    const { avisar, confirmar, avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [leyendo, setLeyendo] = useState([])
    const [leyendoIndex, setLeyendoIndex] = useState(0)
    const [retosActivos, setRetosActivos] = useState([])
    const [retoIndex, setRetoIndex] = useState(0)
    const [popularesAmigos, setPopularesAmigos] = useState([])
    const [loading, setLoading] = useState(true)
    const [editandoProgreso, setEditandoProgreso] = useState(false)
    const [nuevaPagina, setNuevaPagina] = useState('')
    const [errorProgreso, setErrorProgreso] = useState('')
    const [mostrarFinalizarModal, setMostrarFinalizarModal] = useState(false)
    const [mostrarAbandonarModal, setMostrarAbandonarModal] = useState(false)
    const [mostrarAnotacionModal, setMostrarAnotacionModal] = useState(false)
    const [librosPopulares, setLibrosPopulares] = useState([])
    const { racha, refrescarRacha } = useRacha()
    // Tras registrar lectura se piden las notificaciones al momento: si se cumple un reto, sale su aviso
    const { refrescar: refrescarNotificaciones } = useNotificaciones()

    useEffect(() => {
        if (retoIndex >= retosActivos.length) {
            setRetoIndex(0)
        }
    }, [retoIndex, retosActivos])

    const cargarLeyendo = useCallback(async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/estado/LEYENDO`)
            const datos = res.data || []
            datos.sort((a, b) => b.idseguimiento - a.idseguimiento)
            setLeyendo(datos)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar lo que estás leyendo.') }
        finally { setLoading(false) }
    }, [avisarCarga, usuario])

    const cargarRetos = useCallback(async () => {
        try {
            const res = await api.get(`/retos/usuario/${usuario.id}/activos?size=10`)
            const nuevos = res.data.content || res.data || []
            setRetosActivos(nuevos)
            return nuevos
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar tus retos.') }
        return []
    }, [avisarCarga, usuario])

    const cargarPopularesAmigos = useCallback(async () => {
        try {
            const res = await api.get(`/libros/populares-amigos/${usuario.id}?size=12`)
            setPopularesAmigos(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [usuario])

    const cargarLibrosPopulares = useCallback(async () => {
        try {
            const res = await api.get('/libros/populares?size=12')
            setLibrosPopulares(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [])

    useEffect(() => {
        if (usuario) {
            cargarLeyendo()
            cargarRetos()
            cargarLibrosPopulares()
            cargarPopularesAmigos()
        }
    }, [cargarLeyendo, cargarLibrosPopulares, cargarPopularesAmigos, cargarRetos, usuario])

    const actualizarProgreso = async () => {
        if (!nuevaPagina) return
        setErrorProgreso('')
        const libroActual = leyendo[leyendoIndex]

        const salto = parseInt(nuevaPagina) - (libroActual.numPagina || 0)
        if (salto > 200 && !await confirmar({ titulo: `¿Registrar ${salto} páginas de golpe?`, texto: 'Es un salto grande. Comprueba que la página es la correcta.', aceptar: 'Sí, registrar' })) return

        try {
            await api.post('/seguimientos', {
                estado: 'LEYENDO',
                idusuario: usuario.id,
                idlibro: libroActual.idlibro,
                numPagina: parseInt(nuevaPagina),
            })
            refrescarRacha()
            setEditandoProgreso(false)
            setNuevaPagina('')

            if (libroActual.totalPaginas && parseInt(nuevaPagina) >= libroActual.totalPaginas) {
                await api.post('/seguimientos', {
                    estado: 'LEIDO',
                    idusuario: usuario.id,
                    idlibro: libroActual.idlibro,
                })
                cargarRetos()
                refrescarNotificaciones()
                navigate(`/libro/${libroActual.idlibro}/resena`)
            } else {
                cargarLeyendo()
                cargarRetos()
                refrescarNotificaciones()
                setMostrarAnotacionModal(true)
            }
        } catch (err) {
            setErrorProgreso(err.response?.data?.mensaje || 'Error al actualizar')
        }
    }

    const marcarComoLeido = async () => {
        const libroActual = leyendo[leyendoIndex]
        try {
            await api.post('/seguimientos', {
                estado: 'LEIDO',
                idusuario: usuario.id,
                idlibro: libroActual.idlibro,
            })
            refrescarNotificaciones()
            navigate(`/libro/${libroActual.idlibro}/resena`)
        } catch (err) {
            avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.')
        }
    }

    const marcarComoAbandonado = async () => {
        const libroActual = leyendo[leyendoIndex]
        try {
            await api.post('/seguimientos', {
                estado: 'ABANDONADO',
                idusuario: usuario.id,
                idlibro: libroActual.idlibro,
            })
            if (leyendoIndex >= leyendo.length - 1) setLeyendoIndex(Math.max(0, leyendoIndex - 1))
            cargarLeyendo()
        } catch (err) {
            avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.')
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') actualizarProgreso()
        if (e.key === 'Escape') { setEditandoProgreso(false); setNuevaPagina(''); setErrorProgreso('') }
    }

    if (!usuario) return <Navigate to="/landing" />
    if (loading) return <p className="text-texto-sec">Cargando…</p>

    const libroActual = leyendo[leyendoIndex]
    const retoActual = retosActivos[retoIndex]
    const cancelarEdicion = () => { setEditandoProgreso(false); setNuevaPagina(''); setErrorProgreso('') }

    return (
        <div>
            {/* Cabecera: el libro en curso, protagonista, sobre su portada difuminada */}
            <section className="relative isolate -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-12 mb-4">

                <p className="relative text-sm text-texto-sec mb-8">Hola, {usuario.nombre}.</p>

                <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_15rem]">
                    {/* Leyendo ahora */}
                    <div className="min-w-0">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="etiqueta">Leyendo ahora</h2>
                            {leyendo.length > 1 && (
                                <div className="flex items-center gap-3 text-texto-sec">
                                    <button onClick={() => { setLeyendoIndex(i => i === 0 ? leyendo.length - 1 : i - 1); setEditandoProgreso(false) }}
                                            className="hover:text-texto" aria-label="Libro anterior">
                                        <CaretLeft size={16} />
                                    </button>
                                    <span className="text-xs tabular-nums">{leyendoIndex + 1} de {leyendo.length}</span>
                                    <button onClick={() => { setLeyendoIndex(i => i === leyendo.length - 1 ? 0 : i + 1); setEditandoProgreso(false) }}
                                            className="hover:text-texto" aria-label="Libro siguiente">
                                        <CaretRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {leyendo.length === 0 ? (
                            <div className="py-10 border-y border-linea">
                                <p className="font-serif text-3xl text-texto leading-tight">No tienes ningún libro entre manos.</p>
                                <p className="text-texto-sec mt-2">Busca el siguiente en el catálogo y empieza cuando quieras.</p>
                                <Link to="/catalogo" className="btn-acento mt-6">Explorar libros</Link>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-8 sm:gap-10">
                                <Link to={`/libro/${libroActual.idlibro}`} className="group flex-shrink-0 self-start">
                                    <Portada src={libroActual.portadaLibro} titulo={libroActual.tituloLibro} autor={libroActual.nombreAutor}
                                             id={libroActual.idlibro} className="w-36 sm:w-44" />
                                </Link>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <Link to={`/libro/${libroActual.idlibro}`}
                                          className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-texto hover:text-acento">
                                        {libroActual.tituloLibro}
                                    </Link>
                                    {libroActual.nombreAutor && <p className="text-texto-sec mt-3">{libroActual.nombreAutor}</p>}

                                    <div className="mt-8 max-w-xl">
                                        <ProgresoLectura pagina={libroActual.numPagina} total={libroActual.totalPaginas}
                                                         porcentaje={libroActual.porcentaje} />
                                    </div>

                                    {editandoProgreso ? (
                                        <div className="mt-6">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <label htmlFor="nueva-pagina" className="text-texto-sec text-sm">Voy por la página</label>
                                                <input id="nueva-pagina" type="number" value={nuevaPagina}
                                                       onChange={(e) => setNuevaPagina(e.target.value)} onKeyDown={handleKeyDown} autoFocus
                                                       min={libroActual.numPagina + 1} max={libroActual.totalPaginas || undefined}
                                                       className="campo w-24" />
                                                <span className="text-texto-ter text-sm">de {libroActual.totalPaginas || '?'}</span>
                                                <button onClick={actualizarProgreso} className="btn-acento">Guardar</button>
                                                <button onClick={cancelarEdicion} className="btn-texto">Cancelar</button>
                                            </div>
                                            {errorProgreso && <p className="text-error text-xs mt-2">{errorProgreso}</p>}
                                        </div>
                                    ) : (
                                        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                                            <button onClick={() => { setEditandoProgreso(true); setNuevaPagina(String(libroActual.numPagina + 1)) }}
                                                    className="btn-acento">
                                                Actualizar página
                                            </button>
                                            <Link to={`/libro/${libroActual.idlibro}/anotaciones`} className="btn-texto">
                                                <NotePencil size={16} /> Anotar
                                            </Link>
                                            <button onClick={() => setMostrarFinalizarModal(true)} className="btn-texto hover:text-exito">
                                                <Check size={16} /> Lo he terminado
                                            </button>
                                            <button onClick={() => setMostrarAbandonarModal(true)} className="btn-texto hover:text-error">
                                                <X size={16} /> Abandonar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Margen derecho: racha y retos */}
                    <aside className="lg:border-l lg:border-linea lg:pl-8 space-y-10">
                        {racha && (
                            <div>
                                <h2 className="etiqueta mb-3">Racha</h2>
                                <p className="font-serif text-texto leading-none">
                                    <span className="text-6xl">{racha.racha}</span>
                                    <span className="text-xl text-texto-sec ml-2">{racha.racha === 1 ? 'día' : 'días'}</span>
                                </p>
                                <p className="text-texto-sec text-sm mt-2">
                                    {racha.hoyCompletado ? 'Hoy ya has leído.' : 'Lee hoy para no perderla.'}
                                </p>
                                {racha.semana?.length > 0 && <div className="mt-4"><SemanaRacha semana={racha.semana} /></div>}
                            </div>
                        )}

                        <div>
                            <div className="flex items-baseline justify-between mb-3">
                                <h2 className="etiqueta">Retos</h2>
                                <Link to="/retos" className="text-xs text-texto-sec hover:text-acento">Ver todos</Link>
                            </div>
                            {retosActivos.length === 0 || !retoActual ? (
                                <p className="text-texto-sec text-sm">
                                    Ningún reto en marcha. <Link to="/retos" className="text-acento hover:text-acento-hover">Busca uno</Link>
                                </p>
                            ) : (() => {
                                const tipo = retoActual.tipoReto || retoActual.tipo
                                const textoProgreso = tipo === 'HORAS'
                                    ? `${((retoActual.progreso || 0) / 60).toFixed(1)} / ${retoActual.meta} h`
                                    : `${retoActual.progreso || 0} / ${retoActual.meta}`
                                const pct = Math.min(100, retoActual.porcentaje || 0)
                                return (
                                    <div>
                                        <p className="font-serif text-lg leading-snug text-texto">{retoActual.tituloReto || retoActual.titulo}</p>
                                        <div className="relative h-[2px] bg-linea mt-3">
                                            <div className="absolute inset-y-0 left-0 bg-acento" style={{ width: `${pct}%` }} />
                                        </div>
                                        <p className="text-xs text-texto-sec mt-2 tabular-nums">{textoProgreso} · {pct}%</p>
                                        {retosActivos.length > 1 && (
                                            <div className="flex items-center gap-3 mt-3 text-texto-sec">
                                                <button onClick={() => setRetoIndex(i => i === 0 ? retosActivos.length - 1 : i - 1)}
                                                        className="hover:text-texto" aria-label="Reto anterior">
                                                    <CaretLeft size={14} />
                                                </button>
                                                <span className="text-xs tabular-nums">{retoIndex + 1} de {retosActivos.length}</span>
                                                <button onClick={() => setRetoIndex(i => i === retosActivos.length - 1 ? 0 : i + 1)}
                                                        className="hover:text-texto" aria-label="Reto siguiente">
                                                    <CaretRight size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}
                        </div>

                    </aside>
                </div>
            </section>

            {/* Filas de libros, separadas por filetes */}
            {librosPopulares.length > 0 && <FilaLibros titulo="Libros populares" libros={librosPopulares} verTodo="/catalogo" />}

            {/* Sin "ver todo": el catálogo no tiene una vista de lo que leen tus amigos */}
            {popularesAmigos.length > 0 && <FilaLibros titulo="Popular entre tus amigos" libros={popularesAmigos} />}

            {/* Actividad de las personas que sigues */}
            <ActividadSeguidos />

            {mostrarFinalizarModal && (
                <Dialogo titulo="¿Lo has terminado?" onCerrar={() => setMostrarFinalizarModal(false)}
                         acciones={<>
                             <button onClick={() => setMostrarFinalizarModal(false)} className="btn-texto px-2">Todavía no</button>
                             <button onClick={async () => { setMostrarFinalizarModal(false); await marcarComoLeido() }} className="btn-acento">
                                 Sí, lo he terminado
                             </button>
                         </>}>
                    {leyendo[leyendoIndex]?.tituloLibro}
                </Dialogo>
            )}

            {mostrarAbandonarModal && (
                <Dialogo titulo="¿Lo dejas aquí?" onCerrar={() => setMostrarAbandonarModal(false)}
                         acciones={<>
                             <button onClick={() => setMostrarAbandonarModal(false)} className="btn-texto px-2">Seguir leyendo</button>
                             <button onClick={async () => { setMostrarAbandonarModal(false); await marcarComoAbandonado() }}
                                     className="btn bg-error text-fondo hover:bg-error/85">
                                 Sí, abandonar
                             </button>
                         </>}>
                    {leyendo[leyendoIndex]?.tituloLibro}. Siempre puedes retomarlo más adelante.
                </Dialogo>
            )}

            {mostrarAnotacionModal && (
                <Dialogo titulo="¿Escribes algo en el margen?" onCerrar={() => setMostrarAnotacionModal(false)}
                         acciones={<>
                             <button onClick={() => setMostrarAnotacionModal(false)} className="btn-texto px-2">Ahora no</button>
                             <button onClick={() => { setMostrarAnotacionModal(false); navigate(`/libro/${leyendo[leyendoIndex]?.idlibro}/anotaciones`) }}
                                     className="btn-acento">
                                 Anotar
                             </button>
                         </>}>
                    Una idea, una frase que te ha gustado o lo que te ha hecho pensar lo que acabas de leer.
                </Dialogo>
            )}
        </div>
    )
}
