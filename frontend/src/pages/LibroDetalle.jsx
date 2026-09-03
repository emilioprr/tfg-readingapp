import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Estrellas from '../components/Estrellas'

export default function LibroDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const [libro, setLibro] = useState(null)
    const [resenas, setResenas] = useState([])
    const [estadoLibro, setEstadoLibro] = useState(null)
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
    const [listas, setListas] = useState([])
    const [mostrarListas, setMostrarListas] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarLibro()
        cargarResenas()
        cargarEstado()
        cargarListas()
    }, [id, usuario])

    const cargarLibro = async () => {
        try {
            const res = await api.get(`/libros/${id}`)
            setLibro(res.data)
        } catch (err) {
            console.error('Error cargando libro:', err)
        } finally {
            setLoading(false)
        }
    }

    const cargarResenas = async () => {
        try {
            const res = await api.get(`/resenas/libro/${id}?size=5`)
            setResenas(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando reseñas:', err)
        }
    }

    const cargarEstado = async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/libro/${id}`)
            const datos = res.data || []
            if (datos.length > 0) {
                setEstadoLibro(datos[datos.length - 1].estado)
            }
        } catch (err) {
            console.error('Error cargando estado:', err)
        }
    }

    const cargarListas = async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/listas/usuario/${usuario.id}`)
            setListas(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando listas:', err)
        }
    }

    const marcarLeyendo = async () => {
        try {
            await api.post('/seguimientos', {
                estado: 'LEYENDO',
                idusuario: usuario.id,
                idlibro: parseInt(id),
            })
            setEstadoLibro('LEYENDO')
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error al empezar a leer')
        }
    }

    const agregarFavorito = async () => {
        try {
            await api.post(`/favoritos/usuario/${usuario.id}/libro/${id}`)
            alert('Añadido a favoritos')
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error al añadir a favoritos')
        }
    }

    const agregarALista = async (idlista) => {
        try {
            await api.post(`/listas/${idlista}/libros/${id}`)
            setMostrarListas(false)
            alert('Libro añadido a la lista')
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error al añadir a la lista')
        }
    }

    const agregarAWishlist = async () => {
        const wishlist = listas.find(l => l.esAutomatica && l.nombre === 'Wishlist')
        if (wishlist) {
            agregarALista(wishlist.idlista)
        } else {
            alert('No se encontró tu wishlist')
        }
    }

    if (loading) return <p className="text-gray-400">Cargando...</p>
    if (!libro) return <p className="text-red-400">Libro no encontrado</p>

    const listasNormales = listas.filter(l => !l.esAutomatica)

    const getColorNota = (nota) => {
        if (nota < 2) return '#ef4444'
        if (nota < 4) return '#f97316'
        if (nota < 5) return '#ca8a04'
        if (nota < 6) return '#eab308'
        if (nota < 7) return '#84cc16'
        if (nota < 8) return '#22c55e'
        if (nota < 9) return '#f59e0b'
        return '#a855f7'
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0 relative">
                    {libro.notaMedia && (
                        <div className="absolute -top-3 -left-3 z-10 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-lg"
                             style={{ backgroundColor: getColorNota(libro.notaMedia) }}>
                            {libro.notaMedia}
                        </div>
                    )}
                    {libro.portada ? (
                        <img src={libro.portada} alt={libro.titulo} className="w-48 h-72 object-cover rounded-lg" />
                    ) : (
                        <div className="w-48 h-72 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                            Sin portada
                        </div>
                    )}
                    {libro.numResenas > 0 && (
                        <p className="text-xs text-gray-500 text-center mt-1">{libro.numResenas} reseñas</p>
                    )}
                </div>

                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-amber-400 mb-2">{libro.titulo}</h1>
                    <Link to={`/autor/${libro.idautor}`} className="text-gray-400 hover:text-amber-400 text-lg">
                        {libro.nombreAutor}
                    </Link>

                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        {libro.genero && <span>{libro.genero}</span>}
                        {libro.anioPublicacion && <span>{libro.anioPublicacion}</span>}
                        {libro.numPaginas && <span>{libro.numPaginas} páginas</span>}
                    </div>

                    {libro.sinopsis && (
                        <p className="text-gray-300 mt-4 leading-relaxed">{libro.sinopsis}</p>
                    )}

                    {usuario && (
                        <div className="flex flex-wrap gap-3 mt-6">
                            {estadoLibro === 'LEYENDO' ? (
                                <Link to={`/libro/${id}/seguimiento`}
                                      className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-4 py-2 rounded">
                                    Seguimiento
                                </Link>
                            ) : (
                                <button onClick={() => setMostrarConfirmacion(true)}
                                        className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-4 py-2 rounded">
                                    Empezar a leer
                                </button>
                            )}
                            <button onClick={agregarFavorito}
                                    className="border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 px-4 py-2 rounded">
                                ♥ Favorito
                            </button>
                            <button onClick={agregarAWishlist}
                                    className="border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 px-4 py-2 rounded">
                                ☆ Wishlist
                            </button>
                            <div className="relative">
                                <button onClick={() => setMostrarListas(!mostrarListas)}
                                        className="border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 px-4 py-2 rounded">
                                    + Lista
                                </button>
                                {mostrarListas && (
                                    <div className="absolute top-12 left-0 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 w-56">
                                        {listasNormales.length === 0 ? (
                                            <p className="p-3 text-gray-500 text-sm">No tienes listas</p>
                                        ) : (
                                            listasNormales.map((lista) => (
                                                <button key={lista.idlista}
                                                        onClick={() => agregarALista(lista.idlista)}
                                                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-amber-400 text-sm">
                                                    {lista.nombre}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            <Link to={`/libro/${id}/resena`}
                                  className="border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 px-4 py-2 rounded">
                                Escribir reseña
                            </Link>
                            <Link to={`/libro/${id}/recomendar`}
                                  className="border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 px-4 py-2 rounded">
                                Recomendar
                            </Link>
                            {estadoLibro === 'LEYENDO' && (
                                <Link to={`/libro/${id}/anotaciones`}
                                      className="border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 px-4 py-2 rounded">
                                    Anotaciones
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-10">
                <h2 className="text-xl font-bold text-amber-400 mb-4">Reseñas</h2>
                {resenas.length === 0 ? (
                    <p className="text-gray-500">Aún no hay reseñas para este libro</p>
                ) : (
                    <div className="space-y-4">
                        {resenas.map((resena) => (
                            <div key={resena.idresena} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-amber-400 font-medium">{resena.nombreUsuario}</span>
                                    <Estrellas puntuacion={resena.puntuacion} />
                                </div>
                                {resena.tieneSpoiler ? (
                                    <p className="text-gray-500 italic">Esta reseña contiene spoilers</p>
                                ) : (
                                    <p className="text-gray-300">{resena.texto}</p>
                                )}
                                {resena.etiquetas && resena.etiquetas.length > 0 && (
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {resena.etiquetas.map((et) => (
                                            <span key={et} className="text-xs bg-gray-800 text-amber-400 px-2 py-1 rounded">{et}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {mostrarConfirmacion && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-amber-500/20 rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-amber-400 mb-2">¿Empezar a leer?</h3>
                        <p className="text-gray-300 mb-6">{libro.titulo}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setMostrarConfirmacion(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-gray-200">
                                Cancelar
                            </button>
                            <button onClick={async () => {
                                await marcarLeyendo()
                                setMostrarConfirmacion(false)
                            }}
                                    className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-4 py-2 rounded">
                                Sí, empezar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}