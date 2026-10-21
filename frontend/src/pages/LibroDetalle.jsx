import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import ResenaCard from '../components/ResenaCard'
import api from '../api/axios'
import SpoilerOculto from '../components/SpoilerOculto'
import PuntuarLibro from '../components/PuntuarLibro'
import Portada from '../components/Portada'
import Dialogo from '../components/Dialogo'
import { Star, PaperPlaneTilt, ListPlus, Lightning, Check } from '@phosphor-icons/react'
import GuardarEnListaModal from '../components/GuardarEnListaModal'
import Pestanas from '../components/Pestanas'
import TextoDesplegable from '../components/TextoDesplegable'
import { formatoMedia } from '../utils/notas'
import { FRASES_RITMO, nivelRitmo } from '../utils/ritmo'
import { useAvisos } from '../context/AvisosContext'
import { nombreEtiqueta } from '../utils/etiquetas'

// Filtros de las pestañas de reseñas y anotaciones (texto sencillo; el activo, en texto principal)
function Filtros({ opciones, activo, onCambiar }) {
    return (
        <div className="flex gap-5 mb-6 text-sm" role="group" aria-label="Filtrar">
            {opciones.map((t) => (
                <button key={t.key} onClick={() => onCambiar(t.key)} aria-pressed={activo === t.key}
                        className={activo === t.key ? 'text-texto font-medium' : 'text-texto-sec hover:text-texto'}>
                    {t.label}
                </button>
            ))}
        </div>
    )
}

export default function LibroDetalle() {
    const { avisar, confirmar, avisarCarga } = useAvisos()
    const { id } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [libro, setLibro] = useState(null)
    const [resenas, setResenas] = useState([])
    const [estadoLibro, setEstadoLibro] = useState(null)
    const [lecturaAntigua, setLecturaAntigua] = useState(false)
    const [esFavorito, setEsFavorito] = useState(false)
    const [numFavoritos, setNumFavoritos] = useState(0)
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
    const [mostrarListas, setMostrarListas] = useState(false)
    const [loading, setLoading] = useState(true)
    const [anotacionesPublicas, setAnotacionesPublicas] = useState([])
    const [tabPrincipal, setTabPrincipal] = useState('resenas')
    const [subTabResenas, setSubTabResenas] = useState('todas')
    const [subTabAnotaciones, setSubTabAnotaciones] = useState('todas')
    const [resenasLibro, setResenasLibro] = useState([])
    const [seguidos, setSeguidos] = useState(new Set())
    const [misResenas, setMisResenas] = useState([])
    const [misAnotaciones, setMisAnotaciones] = useState([])
    const [totalResenas, setTotalResenas] = useState(0)
    const [puedeRecomendar, setPuedeRecomendar] = useState(false)

    const cargarLibro = useCallback(async () => {
        try { const res = await api.get(`/libros/${id}`); setLibro(res.data) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar el libro.') }
        finally { setLoading(false) }
    }, [avisarCarga, id])

    const cargarResenas = useCallback(async () => {
        try {
            const res = await api.get(`/resenas/libro/${id}?size=5`)
            setResenas(res.data.content || res.data || [])
            setTotalResenas(res.data.totalElements || res.data.length || 0)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar las reseñas.') }
    }, [avisarCarga, id])

    const cargarEstado = useCallback(async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/libro/${id}`)
            const datos = res.data || []
            const ultimo = datos.length > 0 ? datos[datos.length - 1] : null
            setEstadoLibro(ultimo ? ultimo.estado : null)
            setLecturaAntigua(!!ultimo?.lecturaAntigua)
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    const cargarFavoritos = useCallback(async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/libros/favoritos/${usuario.id}`)
            const favs = res.data || []
            setNumFavoritos(favs.length)
            setEsFavorito(favs.some(f => f.idlibro === parseInt(id)))
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    const cargarAnotaciones = useCallback(async () => {
        try {
            const res = await api.get(`/anotaciones/libro/${id}/publicas`)
            setAnotacionesPublicas(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar las anotaciones.') }
    }, [avisarCarga, id])

    // Reseñas públicas del libro sin filtrar; las "de amigos" se sacan de aquí con la lista de seguidos
    const cargarResenasLibro = useCallback(async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/resenas/libro/${id}?size=50`)
            setResenasLibro(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    const cargarMisResenas = useCallback(async () => {
        if (!usuario) return
        try {
            // Tus reseñas (también las privadas), no solo las públicas del libro
            const res = await api.get(`/resenas/usuario/${usuario.id}?size=200`)
            const todas = res.data.content || res.data || []
            setMisResenas(todas.filter(r => r.idlibro === parseInt(id)))
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    const cargarMisAnotaciones = useCallback(async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/anotaciones/usuario/${usuario.id}/libro/${id}`)
            setMisAnotaciones(res.data || [])
        } catch (err) { console.error('Error:', err) }
    }, [id, usuario])

    // A quién sigues (para los filtros "De amigos") y si puedes recomendar: solo a mutuals (os seguís
    // mutuamente); sin ninguno no se muestra el botón
    const cargarSeguidos = useCallback(async () => {
        if (!usuario) return
        try {
            const [seguidosRes, seguidoresRes] = await Promise.all([
                api.get(`/usuarios/${usuario.id}/seguidos`),
                api.get(`/usuarios/${usuario.id}/seguidores`),
            ])
            const ids = (seguidosRes.data || []).map(u => u.idusuario)
            const meSiguen = new Set((seguidoresRes.data || []).map(u => u.idusuario))
            setSeguidos(new Set(ids))
            setPuedeRecomendar(ids.some(i => meSiguen.has(i)))
        } catch (err) { console.error('Error:', err) }
    }, [usuario])

    useEffect(() => { cargarSeguidos() }, [cargarSeguidos])

    useEffect(() => {
        cargarLibro()
        cargarResenas()
        cargarEstado()
        cargarFavoritos()
        cargarAnotaciones()
        cargarResenasLibro()
        cargarMisResenas()
        cargarMisAnotaciones()
    }, [cargarAnotaciones, cargarEstado, cargarFavoritos, cargarLibro, cargarMisAnotaciones, cargarMisResenas, cargarResenas, cargarResenasLibro, id, usuario])

    const toggleFavorito = async () => {
        try {
            if (esFavorito) {
                await api.delete(`/libros/${id}/favorito/${usuario.id}`)
                setEsFavorito(false)
                setNumFavoritos(prev => prev - 1)
            } else {
                if (numFavoritos >= 5) {
                    avisar('Ya tienes 5 libros favoritos. Quita uno para añadir otro.', 'info')
                    return
                }
                await api.post(`/libros/${id}/favorito/${usuario.id}`)
                setEsFavorito(true)
                setNumFavoritos(prev => prev + 1)
            }
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    const marcarLeyendo = async () => {
        try {
            await api.post('/seguimientos', { estado: 'LEYENDO', idusuario: usuario.id, idlibro: parseInt(id) })
            setEstadoLibro('LEYENDO')
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
        navigate('/')
    }

    const agregarAWishlist = async () => {
        try {
            await api.post('/seguimientos', { estado: 'PENDIENTE', idusuario: usuario.id, idlibro: parseInt(id) })
            setEstadoLibro('PENDIENTE')
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    if (loading) return <p className="text-texto-sec">Cargando…</p>
    if (!libro) return <p className="font-serif text-xl text-texto-sec">Este libro no existe o no se ha podido cargar.</p>

    const dist = libro.distribucionNotas || {}
    const distKeys = ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0']
    const maxDist = Math.max(...distKeys.map(k => dist[k] || 0), 1)
    const notaMedia = libro.notaMedia // sobre 5
    // Tu reseña más reciente de este libro (si lo has releído puede haber varias)
    const resenasAmigos = resenasLibro.filter(r => seguidos.has(r.idusuario))
    const anotacionesAmigos = anotacionesPublicas.filter(a => seguidos.has(a.idusuario))
    const miResena = [...misResenas].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))[0]

    const opcionesFiltro = [
        { key: 'todas', label: 'Todas' },
        ...(usuario ? [{ key: 'amigos', label: 'De amigos' }, { key: 'mias', label: 'Mías' }] : []),
    ]
    // Ficha de catálogo del margen
    const ficha = [
        ['Autor', libro.nombreAutor && <Link to={`/autor/${libro.idautor}`} className="hover:text-acento">{libro.nombreAutor}</Link>],
        ['Páginas', libro.numPaginas],
        ['Publicado', libro.anioPublicacion],
        ['Género', libro.genero],
        ['ISBN', libro.isbn],
    ].filter(([, valor]) => valor)

    return (
        <div>
            {/* Cabecera a todo el ancho, sobre la portada difuminada */}
            <section className="relative isolate -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 pb-14 mb-4">

                <div className="relative max-w-6xl mx-auto grid gap-10 md:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)_13rem] lg:gap-12">
                    {/* Portada y tu nota */}
                    <div className="flex flex-col items-center md:items-start">
                        <Portada src={libro.portada} titulo={libro.titulo} autor={libro.nombreAutor} id={libro.idlibro}
                                 elevar={false} className="w-44 md:w-full" />
                        {usuario && (
                            <PuntuarLibro idlibro={id} estado={estadoLibro} lecturaAntigua={lecturaAntigua} miResena={miResena}
                                          onCambio={() => { cargarLibro(); cargarEstado(); cargarMisResenas(); cargarResenas() }} />
                        )}
                    </div>

                    {/* Título, nota, acciones y sinopsis */}
                    <div className="min-w-0">
                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.02] tracking-tight text-texto">{libro.titulo}</h1>
                        <Link to={`/autor/${libro.idautor}`} className="inline-block text-lg text-texto-sec hover:text-acento mt-3">
                            {libro.nombreAutor}
                        </Link>
                        {usuario && usuario.rol === 'ADMIN' && (
                            <Link to={`/libro/${id}/editar`} className="block text-texto-ter hover:text-acento text-sm mt-1">Editar libro</Link>
                        )}

                        <div className="flex items-end gap-4 mt-8">
                            {notaMedia != null ? (
                                <>
                                    <span className="font-serif text-6xl leading-none text-texto">{formatoMedia(notaMedia)}</span>
                                    <div className="pb-1">
                                        <Estrellas puntuacion={notaMedia} />
                                        <p className="text-texto-sec text-xs mt-1">
                                            {libro.numValoraciones} {libro.numValoraciones === 1 ? 'valoración' : 'valoraciones'}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-texto-sec text-sm">Nadie lo ha valorado todavía.</p>
                            )}
                        </div>

                        {/* Acciones de lectura según el estado del libro, y las de guardar/compartir */}
                        {usuario && (
                            <div className="flex flex-wrap items-center gap-3 mt-8">
                                {estadoLibro === 'LEYENDO' ? (
                                    <button onClick={() => navigate('/')} className="btn-acento">Actualizar progreso</button>
                                ) : (
                                    <button onClick={() => setMostrarConfirmacion(true)} className="btn-acento">
                                        {estadoLibro === 'LEIDO' ? 'Releer' : 'Empezar a leer'}
                                    </button>
                                )}
                                {!estadoLibro && (
                                    <button onClick={agregarAWishlist} className="btn-secundario">Quiero leer</button>
                                )}
                                {estadoLibro === 'PENDIENTE' && (
                                    <span className="text-texto-sec text-sm flex items-center gap-1.5"><Check size={14} /> En tu pila de pendientes</span>
                                )}
                                <span className="flex items-center gap-4 ml-1 text-texto-sec">
                                    <button onClick={toggleFavorito} title={esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                            aria-label={esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                            className={esFavorito ? 'text-acento' : 'hover:text-acento'}>
                                        <Star size={22} weight={esFavorito ? 'fill' : 'regular'} />
                                    </button>
                                    {puedeRecomendar && (
                                        <button onClick={() => navigate(`/libro/${id}/recomendar`)} title="Recomendar" aria-label="Recomendar"
                                                className="hover:text-texto">
                                            <PaperPlaneTilt size={22} />
                                        </button>
                                    )}
                                    <button onClick={() => setMostrarListas(true)} title="Guardar en lista" aria-label="Guardar en lista"
                                            className="hover:text-texto">
                                        <ListPlus size={22} />
                                    </button>
                                </span>
                            </div>
                        )}

                        {libro.sinopsis && (
                            <TextoDesplegable texto={libro.sinopsis} lineas={7}
                                              className="font-serif text-[17px] leading-[1.7] text-texto/90 max-w-[65ch] mt-10" />
                        )}
                    </div>

                    {/* Ficha de catálogo en el margen */}
                    {ficha.length > 0 && (
                        <aside className="md:col-start-2 lg:col-start-3 lg:border-l lg:border-linea lg:pl-8">
                            <h2 className="etiqueta mb-4">Ficha</h2>
                            <dl className="space-y-3 text-sm">
                                {ficha.map(([nombre, valor]) => (
                                    <div key={nombre}>
                                        <dt className="text-texto-ter text-xs">{nombre}</dt>
                                        <dd className="text-texto mt-0.5 break-words">{valor}</dd>
                                    </div>
                                ))}
                            </dl>
                        </aside>
                    )}
                </div>
            </section>

            <div className="max-w-6xl mx-auto">
                {/* Estadísticas de valoraciones */}
                {libro.numValoraciones > 0 && (
                    <section className="border-t border-linea pt-8 mb-12">
                        {/* Distribución de notas, centrada: de media estrella a cinco (la media ya está arriba) */}
                        <div className="flex flex-col items-center">
                            <h3 className="etiqueta mb-6">Distribución de notas</h3>
                            <div className="flex items-end gap-1.5 sm:gap-2 h-32">
                                {distKeys.map((k) => {
                                    const count = dist[k] || 0
                                    const alto = count > 0 ? Math.max(6, (count / maxDist) * 100) : 3
                                    return (
                                        <div key={k} className="relative h-full flex items-end group">
                                            <div className={`w-5 sm:w-7 rounded-[1px] ${count > 0 ? 'bg-texto/70 group-hover:bg-texto' : 'bg-linea'}`}
                                                 style={{ height: `${alto}%` }} />
                                            {/* Al pasar el ratón: nº de valoraciones con esa nota, encima de la barra */}
                                            <div className="absolute left-1/2 -translate-x-1/2 mb-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                 style={{ bottom: `${alto}%` }}>
                                                <div className="bg-superficie border border-linea text-texto text-[11px] rounded px-2 py-1 whitespace-nowrap">
                                                    <span className="font-medium">{count}</span> {count === 1 ? 'valoración' : 'valoraciones'}
                                                    <span className="text-texto-sec"> · {k.replace('.', ',')}★</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            {/* Eje: solo las estrellas enteras, bajo su barra */}
                            <div className="flex gap-1.5 sm:gap-2 mt-2 text-[11px] text-texto-ter">
                                {distKeys.map((k) => (
                                    <span key={k} className="w-5 sm:w-7 text-center">{k.endsWith('.0') ? `${parseInt(k)}★` : ''}</span>
                                ))}
                            </div>
                            <p className="text-texto-sec text-xs mt-4">
                                {libro.numValoraciones} {libro.numValoraciones === 1 ? 'valoración' : 'valoraciones'}
                            </p>
                        </div>

                        {/* Ritmo medio, debajo */}
                        <div className="flex flex-col items-center border-t border-linea mt-10 pt-8">
                            <h3 className="etiqueta mb-4">Ritmo</h3>
                            {libro.ritmoMedio ? (
                                <>
                                    <div className="flex gap-1 text-texto">
                                        {[1, 2, 3].map((r) => (
                                            <Lightning key={r} size={24} weight={nivelRitmo(libro.ritmoMedio) >= r ? 'fill' : 'light'}
                                                       className={nivelRitmo(libro.ritmoMedio) >= r ? '' : 'opacity-40'} />
                                        ))}
                                    </div>
                                    <p className="text-texto-sec text-sm mt-2">
                                        {FRASES_RITMO[nivelRitmo(libro.ritmoMedio)]}
                                    </p>
                                </>
                            ) : (
                                <p className="text-texto-sec text-sm">Aún no hay datos de ritmo.</p>
                            )}
                        </div>

                        {/* Etiquetas populares */}
                        {libro.etiquetasPopulares && libro.etiquetasPopulares.length > 0 && (
                            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                                <span className="etiqueta mr-2">Ambiente</span>
                                {libro.etiquetasPopulares.map((et) => (
                                    <span key={et} className="text-xs text-texto-sec border border-linea px-2 py-0.5 rounded">{nombreEtiqueta(et)}</span>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Tabs principales */}
                <Pestanas activa={tabPrincipal} onCambiar={setTabPrincipal} className="mb-6"
                          pestanas={[{ key: 'resenas', label: 'Reseñas' }, { key: 'anotaciones', label: 'Anotaciones' }]} />

                {/* Contenido de Reseñas */}
                {tabPrincipal === 'resenas' && (
                    <div className="mb-12">
                        <Filtros opciones={opcionesFiltro} activo={subTabResenas} onCambiar={setSubTabResenas} />
                        {(() => {
                            const lista = subTabResenas === 'amigos' ? resenasAmigos
                                : subTabResenas === 'mias' ? misResenas
                                    : resenas
                            return lista.length === 0 ? (
                                <p className="font-serif text-xl text-texto-sec py-6">
                                    {subTabResenas === 'amigos' ? 'Tus amigos aún no han escrito sobre este libro.'
                                        : subTabResenas === 'mias' ? 'Todavía no lo has reseñado.'
                                            : 'Nadie ha escrito todavía sobre este libro.'}
                                </p>
                            ) : (
                                <>
                                    <div className="border-t border-linea">
                                        {lista.map((r) => (
                                            <ResenaCard key={r.idresena} resena={r} mostrarLibro={false} />
                                        ))}
                                    </div>
                                    {subTabResenas === 'todas' && totalResenas > 5 && (
                                        <div className="mt-6">
                                            <Link to={`/libro/${id}/resenas`} className="text-sm text-texto-sec hover:text-acento">
                                                Ver las {totalResenas} reseñas
                                            </Link>
                                        </div>
                                    )}
                                </>
                            )
                        })()}
                    </div>
                )}

                {/* Contenido de Anotaciones */}
                {tabPrincipal === 'anotaciones' && (
                    <div className="mb-12">
                        <Filtros opciones={opcionesFiltro} activo={subTabAnotaciones} onCambiar={setSubTabAnotaciones} />
                        {(() => {
                            const lista = subTabAnotaciones === 'amigos' ? anotacionesAmigos
                                : subTabAnotaciones === 'mias' ? misAnotaciones
                                    : anotacionesPublicas
                            return lista.length === 0 ? (
                                <p className="font-serif text-xl text-texto-sec py-6">
                                    {subTabAnotaciones === 'amigos' ? 'Tus amigos no han escrito en sus márgenes.'
                                        : subTabAnotaciones === 'mias' ? 'Todavía no has escrito en los márgenes.'
                                            : 'Nadie ha compartido todavía sus notas de este libro.'}
                                </p>
                            ) : (
                                <div className="divide-y divide-linea border-y border-linea">
                                    {lista.map((a) => (
                                        <article key={a.idanotacion} className="py-5">
                                            <div className="flex items-center justify-between gap-4 mb-2">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-texto-ter">
                                                    <button onClick={() => navigate(`/usuario/${a.idusuario}`)}
                                                            className="text-texto text-sm hover:text-acento">
                                                        {a.nombreUsuario}
                                                    </button>
                                                    <span>{new Date(a.fecha).toLocaleDateString('es-ES')}</span>
                                                    {a.parte && <span>· {a.parte}</span>}
                                                    {!a.esPublica && <span className="border border-linea px-1.5 rounded">Privada</span>}
                                                </div>
                                                {usuario && (usuario.id === a.idusuario || usuario.rol === 'ADMIN') && (
                                                    <button onClick={async (e) => {
                                                        e.stopPropagation()
                                                        if (!await confirmar({ titulo: '¿Eliminar esta anotación?', texto: 'No se puede deshacer.', aceptar: 'Eliminar', peligro: true })) return
                                                        try {
                                                            await api.delete(`/anotaciones/${a.idanotacion}`)
                                                            cargarAnotaciones()
                                                            cargarMisAnotaciones()
                                                        } catch { avisar('No se ha podido eliminar. Inténtalo de nuevo.') }
                                                    }}
                                                            className="text-texto-ter hover:text-error text-xs">
                                                        Eliminar
                                                    </button>
                                                )}
                                            </div>
                                            <SpoilerOculto activo={a.tieneSpoiler && usuario?.id !== a.idusuario}>
                                                <div className="max-w-[65ch]">
                                                    <p className="font-serif text-[17px] leading-[1.65] text-texto/90 whitespace-pre-line">{a.texto}</p>
                                                </div>
                                            </SpoilerOculto>
                                        </article>
                                    ))}
                                </div>
                            )
                        })()}
                    </div>
                )}
            </div>

            {mostrarListas && <GuardarEnListaModal idlibro={parseInt(id)} onClose={() => setMostrarListas(false)} />}

            {/* Confirmación de empezar a leer */}
            {mostrarConfirmacion && (
                <Dialogo titulo={estadoLibro === 'LEIDO' ? '¿Lo relees?' : '¿Empiezas a leerlo?'} onCerrar={() => setMostrarConfirmacion(false)}
                         acciones={<>
                             <button onClick={() => setMostrarConfirmacion(false)} className="btn-texto px-2">Ahora no</button>
                             <button onClick={async () => { await marcarLeyendo(); setMostrarConfirmacion(false) }} className="btn-acento">
                                 Sí, empezar
                             </button>
                         </>}>
                    {libro.titulo}
                </Dialogo>
            )}
        </div>
    )
}
