import { useState, useEffect, useCallback } from 'react'
import {useParams, Link, useSearchParams} from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ResenaCard from '../components/ResenaCard'
import ListaCard from '../components/ListaCard'
import api from '../api/axios'
import SpoilerOculto from '../components/SpoilerOculto'
import MuralCitas from '../components/MuralCitas'
import Pestanas from '../components/Pestanas'
import { CaretLeft, CaretRight, X, Plus } from '@phosphor-icons/react'
import Portada from '../components/Portada'
import Balda from '../components/Balda'
import Carrusel from '../components/Carrusel'
import { useAvisos } from '../context/AvisosContext'

/** Formato corto para contadores: 950 → 950, 1.234 → 1,2K, 1.500.000 → 1,5M.
 *  Se trunca (no redondea) para no mostrar más de lo que hay, p. ej. 999.999 → 999,9K. */
const formatoCorto = (n) => {
    if (n == null) return 0
    const corto = (valor, sufijo) =>
        (Math.floor(valor * 10) / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + sufijo
    if (n >= 1_000_000) return corto(n / 1_000_000, 'M')
    if (n >= 1_000) return corto(n / 1_000, 'K')
    return n
}

export default function Perfil() {
    const { avisar, avisarCarga } = useAvisos()
    const { id } = useParams()
    const { usuario } = useAuth()
    const perfilId = id ? parseInt(id) : usuario?.id
    const esMio = usuario && usuario.id === perfilId

    const [perfil, setPerfil] = useState(null)
    const [favoritos, setFavoritos] = useState([])
    const [resenas, setResenas] = useState([])
    const [anotaciones, setAnotaciones] = useState([])
    const [siguiendo, setSiguiendo] = useState(false)
    const [loading, setLoading] = useState(true)
    const [listasPublicas, setListasPublicas] = useState([])
    // La pestaña va en la URL (?tab=...): así los enlaces del menú funcionan aunque ya estés en el perfil,
    // y recargar la página mantiene la pestaña
    const [searchParams, setSearchParams] = useSearchParams()
    const tab = searchParams.get('tab') || 'libros'
    const setTab = (t) => setSearchParams(t === 'libros' ? {} : { tab: t }, { replace: true })
    const [leyendoLibros, setLeyendoLibros] = useState([])
    const [leidosLibros, setLeidosLibros] = useState([])
    const [pendientesLibros, setPendientesLibros] = useState([])
    const [abandonadosLibros, setAbandonadosLibros] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [racha, setRacha] = useState(null)
    const [leyendoIndex, setLeyendoIndex] = useState(0)


    const cargarPerfil = useCallback(async () => {
        try { const res = await api.get(`/usuarios/${perfilId}`); setPerfil(res.data) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar el perfil.') }
        finally { setLoading(false) }
    }, [avisarCarga, perfilId])

    const cargarFavoritos = useCallback(async () => {
        try {
            const res = await api.get(`/libros/favoritos/${perfilId}`)
            const datos = res.data || []
            datos.sort((a, b) => a.idlibro - b.idlibro)
            setFavoritos(datos)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar todo el perfil. Puede que falten partes.') }
    }, [avisarCarga, perfilId])

    const cargarResenas = useCallback(async () => {
        try {
            const endpoint = esMio
                ? `/resenas/usuario/${perfilId}?size=20`
                : `/resenas/usuario/${perfilId}/publicas?size=20`
            const res = await api.get(endpoint)
            const datos = res.data.content || res.data || []
            datos.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
            setResenas(datos)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar todo el perfil. Puede que falten partes.') }
    }, [avisarCarga, esMio, perfilId])

    const cargarAnotaciones = useCallback(async () => {
        try {
            const res = await api.get(`/anotaciones/usuario/${perfilId}`)
            setAnotaciones(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar todo el perfil. Puede que falten partes.') }
    }, [avisarCarga, perfilId])

    const cargarListasPublicas = useCallback(async () => {
        try {
            // El backend ya devuelve solo las públicas si el perfil no es tuyo
            const res = await api.get(`/listas/usuario/${perfilId}`)
            setListasPublicas(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar todo el perfil. Puede que falten partes.') }
    }, [avisarCarga, perfilId])

    const toggleSeguir = async () => {
        try {
            if (siguiendo) await api.delete(`/usuarios/${usuario.id}/seguir/${perfilId}`)
            else await api.post(`/usuarios/${usuario.id}/seguir/${perfilId}`)
            setSiguiendo(!siguiendo)
            cargarPerfil()
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    const quitarFavorito = async (idlibro) => {
        try {
            await api.delete(`/libros/${idlibro}/favorito/${perfilId}`)
            cargarFavoritos()
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    const comprobarSiguiendo = useCallback(async () => {
        if (!usuario || esMio) return
        try {
            const res = await api.get(`/usuarios/${usuario.id}/seguidos`)
            const seguidos = res.data || []
            setSiguiendo(seguidos.some(u => u.idusuario === perfilId))
        } catch (err) { console.error('Error:', err) }
    }, [esMio, perfilId, usuario])

    // Libros de una balda de la estantería (LEYENDO, LEIDO, PENDIENTE o ABANDONADO)
    const cargarBalda = useCallback(async (estado, guardar) => {
        try {
            const res = await api.get(`/seguimientos/usuario/${perfilId}/estado/${estado}`)
            guardar(res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar todo el perfil. Puede que falten partes.') }
    }, [avisarCarga, perfilId])

    const cargarEstadisticas = useCallback(async () => {
        try { const res = await api.get(`/usuarios/${perfilId}/perfil`); setEstadisticas(res.data) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar todo el perfil. Puede que falten partes.') }
    }, [avisarCarga, perfilId])

    // Solo consulta: ver la racha de alguien no la modifica
    const cargarRacha = useCallback(async () => {
        try { const res = await api.get(`/racha/usuario/${perfilId}`); setRacha(res.data) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar todo el perfil. Puede que falten partes.') }
    }, [avisarCarga, perfilId])

    useEffect(() => {
        if (perfilId) {
            cargarPerfil()
            cargarEstadisticas()
            cargarRacha()
            setLeyendoIndex(0)
            cargarFavoritos()
            cargarResenas()
            cargarAnotaciones()
            cargarBalda('LEYENDO', setLeyendoLibros)
            cargarBalda('LEIDO', setLeidosLibros)
            cargarBalda('PENDIENTE', setPendientesLibros)
            cargarBalda('ABANDONADO', setAbandonadosLibros)
            cargarListasPublicas()
            comprobarSiguiendo()
        }
    }, [cargarAnotaciones, cargarBalda, cargarEstadisticas, cargarRacha, cargarFavoritos, cargarListasPublicas, cargarPerfil, cargarResenas, comprobarSiguiendo, perfilId])

    if (loading) return <p className="text-texto-sec">Cargando…</p>
    if (!perfil) return <p className="font-serif text-xl text-texto-sec">Este perfil no existe o no se ha podido cargar.</p>

    const libroLeyendo = leyendoLibros[leyendoIndex] ?? leyendoLibros[0]
    const favoritosSlots = [...favoritos.slice(0, 5)]
    while (favoritosSlots.length < 5) favoritosSlots.push(null)

    const tabs = [
        { key: 'libros', label: 'Libros' },
        { key: 'estanteria', label: 'Estantería' },
        { key: 'resenas', label: 'Reseñas' },
        { key: 'anotaciones', label: 'Anotaciones' },
        { key: 'citas', label: 'Mural de citas' },
        { key: 'listas', label: 'Listas' },
    ]

    // Seguimientos -> libros para las baldas
    const aBalda = (lista) => lista.map((s) => ({
        key: s.idseguimiento, idlibro: s.idlibro, titulo: s.tituloLibro, autor: s.nombreAutor, portada: s.portadaLibro,
    }))
    const estanterias = [
        { estado: 'PENDIENTE', titulo: 'Quiero leer', libros: pendientesLibros,
          vacio: esMio ? 'Tu pila de pendientes está sorprendentemente baja.' : 'No tiene nada pendiente.' },
        { estado: 'LEYENDO', titulo: 'Leyendo', libros: leyendoLibros,
          vacio: esMio ? 'Ahora mismo no tienes ningún libro entre manos.' : 'Ahora mismo no está leyendo nada.' },
        { estado: 'LEIDO', titulo: 'Leídos', libros: leidosLibros,
          vacio: esMio ? 'Tu estantería de leídos espera su primer libro.' : 'Todavía no ha terminado ningún libro.' },
        { estado: 'ABANDONADO', titulo: 'Abandonados', libros: abandonadosLibros, ocultarSiVacio: true },
    ]
    const vacio = (texto) => <p className="font-serif text-xl text-texto-sec py-4">{texto}</p>

    return (
        <div className="max-w-5xl mx-auto">

            {/* Cabecera: nombre en serif grande; cifras y lectura actual en el margen */}
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 pt-2">
                <div className="flex items-start gap-5 min-w-0">
                    {perfil.avatar ? (
                        <img src={perfil.avatar} alt={perfil.nombre} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 border border-linea rounded-full flex items-center justify-center text-texto-sec text-4xl font-serif flex-shrink-0">
                            {perfil.nombre?.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="min-w-0">
                        <h1 className="font-serif text-4xl sm:text-5xl leading-none tracking-tight text-texto break-words">{perfil.nombre}</h1>
                        {perfil.biografia ? (
                            <p className="text-texto-sec leading-relaxed mt-3 max-w-md">{perfil.biografia}</p>
                        ) : (
                            <p className="text-texto-ter text-sm mt-3 italic">{esMio ? 'Todavía no has escrito nada sobre ti.' : 'Sin biografía.'}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            {esMio ? (
                                <Link to="/editar-perfil" className="btn-secundario">Editar perfil</Link>
                            ) : usuario && (
                                <button onClick={toggleSeguir}
                                        className={siguiendo ? 'btn-secundario hover:border-error hover:text-error' : 'btn-acento'}>
                                    {siguiendo ? 'Dejar de seguir' : 'Seguir'}
                                </button>
                            )}
                            {racha && racha.racha > 0 && (
                                <span className="text-sm text-texto-sec" title={`${racha.racha} ${racha.racha === 1 ? 'día' : 'días'} de racha`}>
                                    <span className="font-serif text-lg text-acento mr-1">{racha.racha}</span>
                                    {racha.racha === 1 ? 'día' : 'días'} seguidos leyendo
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="md:w-72 flex-shrink-0 space-y-6">
                    {/* Cifras */}
                    {estadisticas && (
                        <dl className="flex gap-6">
                            {[
                                { valor: estadisticas.librosLeidos, label: 'libros' },
                                { valor: estadisticas.paginasLeidas, label: 'páginas' },
                                { valor: estadisticas.resenasEscritas, label: 'reseñas' },
                            ].map((e) => (
                                <div key={e.label} title={e.valor?.toLocaleString('es-ES')}>
                                    <dd className="font-serif text-3xl leading-none text-texto">{formatoCorto(e.valor)}</dd>
                                    <dt className="text-xs text-texto-sec mt-1">{e.label}</dt>
                                </div>
                            ))}
                        </dl>
                    )}

                    {/* Leyendo ahora */}
                    <div className="border-t border-linea pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="etiqueta">Leyendo ahora</span>
                            {leyendoLibros.length > 1 && (
                                <div className="flex items-center gap-2 text-texto-sec">
                                    <button onClick={() => setLeyendoIndex(i => i === 0 ? leyendoLibros.length - 1 : i - 1)}
                                            className="hover:text-texto" aria-label="Anterior"><CaretLeft size={14} /></button>
                                    <span className="text-[11px] tabular-nums">{leyendoIndex + 1}/{leyendoLibros.length}</span>
                                    <button onClick={() => setLeyendoIndex(i => i === leyendoLibros.length - 1 ? 0 : i + 1)}
                                            className="hover:text-texto" aria-label="Siguiente"><CaretRight size={14} /></button>
                                </div>
                            )}
                        </div>
                        {!libroLeyendo ? (
                            <p className="text-texto-ter text-sm">Nada ahora mismo.</p>
                        ) : (
                            <Link to={`/libro/${libroLeyendo.idlibro}`} className="group flex items-center gap-3">
                                <Portada src={libroLeyendo.portadaLibro} titulo={libroLeyendo.tituloLibro} id={libroLeyendo.idlibro}
                                         elevar={false} className="w-9 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-serif text-texto truncate group-hover:text-acento">{libroLeyendo.tituloLibro}</p>
                                    <div className="relative h-[2px] bg-linea mt-2">
                                        <div className="absolute inset-y-0 left-0 bg-acento" style={{ width: `${libroLeyendo.porcentaje || 0}%` }} />
                                    </div>
                                    <p className="text-texto-ter text-[11px] mt-1 tabular-nums">{libroLeyendo.porcentaje || 0}%</p>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* En móvil las pestañas no caben: se desplazan con el dedo */}
            <Pestanas pestanas={tabs} activa={tab} onCambiar={setTab} className="mb-10" desplazable centradas />

            {/* Tab: Libros */}
            {tab === 'libros' && (
                <>
                    {/* Favoritos: cinco portadas a todo el ancho */}
                    <section className="mb-14">
                        <h2 className="etiqueta mb-6">Libros favoritos</h2>
                        <div className="grid grid-cols-5 gap-3 sm:gap-5">
                            {favoritosSlots.map((l, i) => l ? (
                                <div key={l.idlibro} className="relative group/fav">
                                    <Link to={`/libro/${l.idlibro}`} className="group block" title={l.nombreAutor ? `${l.titulo} · ${l.nombreAutor}` : l.titulo}>
                                        <Portada src={l.portada} titulo={l.titulo} autor={l.nombreAutor} id={l.idlibro} className="w-full" />
                                    </Link>
                                    {esMio && (
                                        <button onClick={() => quitarFavorito(l.idlibro)} title="Quitar de favoritos" aria-label="Quitar de favoritos"
                                                className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-fondo/80 text-texto-sec hover:text-error rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover/fav:opacity-100 focus:opacity-100">
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ) : esMio ? (
                                <Link key={`hueco-${i}`} to="/catalogo" title="Añadir un favorito"
                                      className="aspect-[2/3] border border-dashed border-linea rounded-[2px] flex flex-col items-center justify-center gap-2 text-texto-ter hover:text-acento hover:border-acento/50">
                                    <Plus size={18} />
                                    <span className="text-xs hidden sm:inline">Añadir</span>
                                </Link>
                            ) : (
                                <div key={`hueco-${i}`} className="aspect-[2/3] border border-dashed border-linea/60 rounded-[2px]" />
                            ))}
                        </div>
                    </section>

                    {/* Lecturas recientes: de cinco en cinco, alineadas con los favoritos */}
                    <section className="mb-12">
                        {leidosLibros.length === 0 ? (
                            <>
                                <h2 className="etiqueta mb-6">Lecturas recientes</h2>
                                {vacio(esMio ? 'Todavía no has terminado ningún libro aquí.' : 'Todavía no ha terminado ningún libro.')}
                            </>
                        ) : (
                            <Carrusel titulo={<h2 className="etiqueta">Lecturas recientes</h2>}>
                                {leidosLibros.map((s) => (
                                    <Link key={s.idseguimiento} to={`/libro/${s.idlibro}`} className="group snap-start min-w-0">
                                        <Portada src={s.portadaLibro} titulo={s.tituloLibro} autor={s.nombreAutor} id={s.idlibro} className="w-full" />
                                        <p className="font-serif text-xs sm:text-[15px] leading-snug text-texto mt-2 sm:mt-3 line-clamp-2 group-hover:text-acento">{s.tituloLibro}</p>
                                        <p className="hidden sm:block text-xs text-texto-ter mt-0.5">{s.fecha}</p>
                                    </Link>
                                ))}
                            </Carrusel>
                        )}
                    </section>
                </>
            )}

            {/* Tab: Estantería, con los libros sobre sus baldas */}
            {tab === 'estanteria' && (
                <div className="space-y-14">
                    {estanterias.filter((e) => !(e.ocultarSiVacio && e.libros.length === 0)).map((e) => (
                        <section key={e.estado}>
                            <div className="flex items-baseline justify-between mb-6">
                                <h2 className="etiqueta">{e.titulo} <span className="text-texto-ter ml-1">{e.libros.length}</span></h2>
                                {e.libros.length > 6 && (
                                    <Link to={`/estanteria/${perfilId}/${e.estado}`} className="text-xs text-texto-sec hover:text-acento">
                                        Ver toda la balda
                                    </Link>
                                )}
                            </div>
                            {e.libros.length === 0 ? vacio(e.vacio) : <Balda libros={aBalda(e.libros.slice(0, 6))} />}
                        </section>
                    ))}
                </div>
            )}

            {/* Tab: Reseñas */}
            {tab === 'resenas' && (
                resenas.length === 0 ? (
                    vacio(esMio ? 'Todavía no has escrito ninguna reseña.' : 'No tiene reseñas públicas.')
                ) : (
                    <div className="border-t border-linea">
                        {resenas.map((r) => (
                            <ResenaCard key={r.idresena} resena={r} mostrarUsuario={false} />
                        ))}
                    </div>
                )
            )}

            {/* Tab: Anotaciones */}
            {tab === 'anotaciones' && (
                anotaciones.length === 0 ? (
                    vacio(esMio ? 'Todavía no has escrito en los márgenes.' : 'Todavía no ha escrito en los márgenes.')
                ) : (
                    <div className="divide-y divide-linea border-y border-linea">
                        {anotaciones.map((a) => (
                            <article key={a.idanotacion} className="flex gap-5 py-6">
                                <Link to={`/libro/${a.idlibro}`} className="group flex-shrink-0 self-start">
                                    <Portada src={a.portadaLibro} titulo={a.tituloLibro} id={a.idlibro} className="w-12" />
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-4 mb-2">
                                        <Link to={`/libro/${a.idlibro}`} className="font-serif text-lg text-texto hover:text-acento truncate">
                                            {a.tituloLibro}
                                        </Link>
                                        <span className="text-texto-ter text-xs flex-shrink-0">{new Date(a.fecha).toLocaleDateString('es-ES')}</span>
                                    </div>
                                    <SpoilerOculto activo={a.tieneSpoiler && usuario?.id !== a.idusuario}>
                                        <div className="max-w-[65ch]">
                                            <p className="font-serif text-[17px] leading-[1.65] text-texto/90 whitespace-pre-line">{a.texto}</p>
                                        </div>
                                    </SpoilerOculto>
                                    {a.parte && <p className="text-texto-ter text-xs mt-2">{a.parte}</p>}
                                </div>
                            </article>
                        ))}
                    </div>
                )
            )}

            {/* Tab: Mural de citas (citas de otros lectores que ha elegido exhibir) */}
            {tab === 'citas' && (
                <MuralCitas perfilId={perfilId} esMio={esMio} usuario={usuario} />
            )}

            {/* Tab: Listas */}
            {tab === 'listas' && (
                listasPublicas.length === 0 ? (
                    <div>
                        {vacio(esMio ? 'Todavía no has hecho ninguna lista.' : 'No tiene listas públicas.')}
                        {esMio && <Link to="/crear-lista" className="btn-secundario">Crear una lista</Link>}
                    </div>
                ) : (
                    <div className="border-t border-linea">
                        {listasPublicas.map((lista) => (
                            <ListaCard key={lista.idlista} lista={lista} />
                        ))}
                    </div>
                )
            )}
        </div>
    )
}
