import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Portada from '../components/Portada'
import Pestanas from '../components/Pestanas'
import { useAvisos } from '../context/AvisosContext'

const SIZE = 24

/** Inicial en un círculo con filete, para quien no tiene foto. */
function Avatar({ src, nombre }) {
    return src
        ? <img src={src} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-linea" />
        : <div className="w-12 h-12 rounded-full flex-shrink-0 border border-linea flex items-center justify-center text-texto-sec font-serif text-lg">{nombre?.charAt(0).toUpperCase()}</div>
}

const vacio = (texto) => <p className="font-serif text-xl text-texto-sec py-6">{texto}</p>

const claveLibro = (l) => (l.externo ? `g-${l.idExterno}` : `l-${l.idlibro}`)

export default function Busqueda() {
    const { avisar, avisarCarga } = useAvisos()
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''
    const { usuario } = useAuth()
    const navigate = useNavigate()

    const [tab, setTab] = useState('libros')
    const [resultados, setResultados] = useState([])
    const [loading, setLoading] = useState(false)
    const [hayMas, setHayMas] = useState(false)
    const [cargandoMas, setCargandoMas] = useState(false)
    const [buscandoExternos, setBuscandoExternos] = useState(false)
    const [abriendo, setAbriendo] = useState(null)
    const [seguidos, setSeguidos] = useState([])

    const paginaLocal = useRef(0)
    const localAgotado = useRef(false)
    const googleIndex = useRef(0)
    const googleAgotado = useRef(false)
    const busquedaId = useRef(0)

    const anadirLibros = useCallback((libros) => {
        setResultados(prev => {
            const claves = new Set(prev.map(claveLibro))
            return [...prev, ...libros.filter(l => !claves.has(claveLibro(l)))]
        })
    }, [])

    // Primero agota la base de datos local; cuando se acaba, sigue con Google Books
    const cargarMasLibros = useCallback(async () => {
        const id = busquedaId.current
        try {
            if (!localAgotado.current) {
                const res = await api.get(`/libros/buscar?titulo=${encodeURIComponent(query)}&page=${paginaLocal.current}&size=${SIZE}`)
                if (id !== busquedaId.current) return
                const locales = (res.data.content || res.data || []).map(l => ({ ...l, externo: false }))
                anadirLibros(locales)
                paginaLocal.current += 1
                setLoading(false)

                if (locales.length === SIZE) {
                    setHayMas(true)
                    return
                }
                // La página local no llegó a 24: rellenamos con Google en la misma tanda
                localAgotado.current = true
            }

            // Google Books solo para usuarios con sesión (el backend lo exige)
            if (!usuario) googleAgotado.current = true

            if (!googleAgotado.current) {
                setBuscandoExternos(true)
                const res = await api.get(`/libros/buscar/google?q=${encodeURIComponent(query)}&startIndex=${googleIndex.current}`)
                if (id !== busquedaId.current) return
                googleIndex.current = res.data.siguienteIndex
                googleAgotado.current = !res.data.hayMas
                anadirLibros(res.data.resultados || [])
            }

            setHayMas(!(localAgotado.current && googleAgotado.current))
        } catch (err) {
            console.error('Error buscando libros:', err); avisarCarga(err, 'No se ha podido completar la búsqueda de libros.')
        } finally {
            if (id === busquedaId.current) {
                setLoading(false)
                setBuscandoExternos(false)
                setCargandoMas(false)
            }
        }
    }, [avisarCarga, anadirLibros, query, usuario])

    const verMas = async () => {
        setCargandoMas(true)
        await cargarMasLibros()
    }

    // Los locales navegan directamente; los externos se importan al abrirlos
    const abrirLibro = async (libro) => {
        if (!libro.externo) {
            navigate(`/libro/${libro.idlibro}`)
            return
        }
        setAbriendo(libro.idExterno)
        try {
            const res = await api.post(`/libros/importar/google/${libro.idExterno}`)
            navigate(`/libro/${res.data.idlibro}`)
        } catch (err) {
            avisar(err.response?.data?.mensaje || 'No se pudo abrir el libro')
        } finally {
            setAbriendo(null)
        }
    }

    const cargarSeguidos = useCallback(async () => {
        try {
            const res = await api.get(`/usuarios/${usuario.id}/seguidos`)
            setSeguidos((res.data || []).map(u => u.idusuario))
        } catch (err) { console.error('Error:', err) }
    }, [usuario])

    const buscarAutores = useCallback(async () => {
        try {
            const res = await api.get(`/autores/buscar?nombre=${encodeURIComponent(query)}`)
            setResultados(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido buscar autores.') }
        finally { setLoading(false) }
    }, [avisarCarga, query])

    const buscarUsuarios = useCallback(async () => {
        try {
            const res = await api.get(`/usuarios/buscar?nombre=${encodeURIComponent(query)}`)
            setResultados(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido buscar usuarios.') }
        finally { setLoading(false) }
    }, [avisarCarga, query])

    useEffect(() => {
        if (!query) return
        busquedaId.current++
        setResultados([])
        setHayMas(false)
        setLoading(true)
        setBuscandoExternos(false)
        paginaLocal.current = 0
        localAgotado.current = false
        googleIndex.current = 0
        googleAgotado.current = false

        if (tab === 'libros') {
            cargarMasLibros()
        } else if (tab === 'autores') {
            buscarAutores()
        } else {
            buscarUsuarios()
            if (usuario) cargarSeguidos()
        }
    }, [buscarAutores, buscarUsuarios, cargarMasLibros, cargarSeguidos, query, tab, usuario])

    const toggleSeguir = async (idusuario) => {
        try {
            if (seguidos.includes(idusuario)) {
                await api.delete(`/usuarios/${usuario.id}/seguir/${idusuario}`)
                setSeguidos(prev => prev.filter(id => id !== idusuario))
            } else {
                await api.post(`/usuarios/${usuario.id}/seguir/${idusuario}`)
                setSeguidos(prev => [...prev, idusuario])
            }
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    const tabs = [
        { key: 'libros', label: 'Libros' },
        { key: 'autores', label: 'Autores' },
        ...(usuario ? [{ key: 'usuarios', label: 'Usuarios' }] : []),
    ]

    if (!query) return <p className="font-serif text-xl text-texto-sec">Escribe algo en el buscador para empezar.</p>

    return (
        <div className="max-w-3xl mx-auto">
            <p className="etiqueta mb-2">Resultados para</p>
            <h1 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight text-texto mb-8 break-words">«{query}»</h1>

            <Pestanas pestanas={tabs} activa={tab} onCambiar={setTab} className="mb-2" />

            {loading && <p className="text-texto-sec py-6">Buscando…</p>}

            {/* Libros */}
            {!loading && tab === 'libros' && (
                <>
                    {resultados.length === 0 && !buscandoExternos ? vacio(`Ningún libro coincide con «${query}».`) : (
                        <div className="divide-y divide-linea">
                            {resultados.map((libro) => (
                                <button key={claveLibro(libro)} type="button" onClick={() => abrirLibro(libro)}
                                        className="w-full text-left py-5 flex gap-5 group relative">
                                    <Portada src={libro.portada} titulo={libro.titulo} autor={libro.nombreAutor} id={libro.idlibro ?? libro.idExterno}
                                             elevar={false} className="w-16 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-serif text-xl leading-snug text-texto group-hover:text-acento line-clamp-2">{libro.titulo}</p>
                                        <p className="text-texto-sec text-sm mt-0.5">
                                            {libro.nombreAutor}
                                            {libro.genero && <span className="text-texto-ter"> · {libro.genero}</span>}
                                            {libro.numPaginas && <span className="text-texto-ter"> · {libro.numPaginas} pág.</span>}
                                        </p>
                                        {libro.sinopsis && (
                                            <p className="text-texto-sec text-sm mt-2 line-clamp-2">{libro.sinopsis}</p>
                                        )}
                                    </div>
                                    {abriendo === libro.idExterno && (
                                        <span className="absolute inset-0 bg-fondo/70 flex items-center justify-center text-texto text-sm">Abriendo…</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {buscandoExternos && (
                        <p className="text-texto-sec text-sm text-center mt-6">Buscando más resultados…</p>
                    )}

                    {hayMas && !buscandoExternos && resultados.length > 0 && (
                        <div className="text-center mt-8">
                            <button onClick={verMas} disabled={cargandoMas} className="btn-secundario">
                                {cargandoMas ? 'Cargando…' : 'Ver más'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Autores */}
            {!loading && tab === 'autores' && (
                resultados.length === 0 ? vacio(`Ningún autor coincide con «${query}».`) : (
                    <div className="divide-y divide-linea">
                        {resultados.map((autor) => (
                            <Link key={autor.idautor} to={`/autor/${autor.idautor}`} className="py-4 flex items-center gap-4 group">
                                <Avatar src={autor.foto} nombre={autor.nombre} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-serif text-lg text-texto group-hover:text-acento">{autor.nombre}</p>
                                    {autor.nacionalidad && <p className="text-texto-sec text-sm">{autor.nacionalidad}</p>}
                                </div>
                            </Link>
                        ))}
                    </div>
                )
            )}

            {/* Usuarios */}
            {!loading && tab === 'usuarios' && (
                resultados.length === 0 ? vacio(`Nadie se llama «${query}» por aquí.`) : (
                    <div className="divide-y divide-linea">
                        {resultados.map((u) => (
                            <div key={u.idusuario} className="py-4 flex items-center gap-4">
                                <Link to={`/usuario/${u.idusuario}`} className="flex items-center gap-4 flex-1 min-w-0 group">
                                    <Avatar src={u.avatar} nombre={u.nombre} />
                                    <div className="min-w-0">
                                        <p className="font-serif text-lg text-texto group-hover:text-acento truncate">{u.nombre}</p>
                                        <p className="text-texto-sec text-sm">{u.seguidores || 0} seguidores</p>
                                    </div>
                                </Link>
                                {usuario && u.idusuario !== usuario.id && (
                                    <button onClick={() => toggleSeguir(u.idusuario)}
                                            className={`flex-shrink-0 ${seguidos.includes(u.idusuario) ? 'btn-secundario' : 'btn-acento'}`}>
                                        {seguidos.includes(u.idusuario) ? 'Siguiendo' : 'Seguir'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    )
}
