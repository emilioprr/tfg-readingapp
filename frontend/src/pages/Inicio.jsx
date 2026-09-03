import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Inicio() {
    const { usuario } = useAuth()
    const [leyendo, setLeyendo] = useState([])
    const [populares, setPopulares] = useState([])
    const [recientes, setRecientes] = useState([])

    useEffect(() => {
        cargarPopulares()
        cargarRecientes()
        if (usuario) {
            cargarLeyendo()
        }
    }, [usuario])

    const cargarLeyendo = async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/estado/LEYENDO`)
            setLeyendo(res.data || [])
        } catch (err) {
            console.error('Error cargando leyendo:', err)
        }
    }

    const cargarPopulares = async () => {
        try {
            const res = await api.get('/resenas/publicas?size=5')
            setPopulares(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando populares:', err)
        }
    }

    const cargarRecientes = async () => {
        try {
            const res = await api.get('/libros?size=6')
            setRecientes(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando recientes:', err)
        }
    }

    return (
        <div>
            {/* Hero */}
            {!usuario ? (
                <div className="text-center py-16">
                    <h1 className="text-5xl font-bold text-amber-400 mb-4">ReadingApp</h1>
                    <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                        Tu espacio para descubrir libros, compartir reseñas y conectar con otros lectores.
                        Lleva el control de tus lecturas con estilo.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link to="/registro"
                              className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-6 py-3 rounded-lg text-lg">
                            Crear cuenta
                        </Link>
                        <Link to="/catalogo"
                              className="border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 px-6 py-3 rounded-lg text-lg">
                            Explorar catálogo
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-amber-400 mb-1">
                        Hola, {usuario.nombre}
                    </h1>
                    <p className="text-gray-400">¿Qué vas a leer hoy?</p>
                </div>
            )}

            {/* Leyendo ahora — solo si logueado */}
            {usuario && leyendo.length > 0 && (
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-amber-400">Leyendo ahora</h2>
                        <Link to="/perfil" className="text-sm text-gray-400 hover:text-amber-400">Ver todo</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {leyendo.map((s) => (
                            <Link key={s.idseguimiento} to={`/libro/${s.idlibro}/seguimiento`} className="group">
                                <div className="bg-gray-900 rounded-lg border border-gray-800 hover:border-amber-500/40 p-3">
                                    <p className="text-sm text-gray-200 truncate group-hover:text-amber-400">{s.tituloLibro}</p>
                                    <div className="mt-2 bg-gray-800 rounded-full h-2">
                                        <div className="bg-amber-500 h-2 rounded-full"
                                             style={{ width: `${s.porcentaje || 0}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{s.porcentaje || 0}% · Pág {s.numPagina}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Libros recientes */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-amber-400">Libros recientes</h2>
                    <Link to="/catalogo" className="text-sm text-gray-400 hover:text-amber-400">Ver catálogo</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {recientes.map((libro) => (
                        <Link key={libro.idlibro} to={`/libro/${libro.idlibro}`} className="group">
                            <div className="bg-gray-900 rounded-lg border border-gray-800 hover:border-amber-500/40 overflow-hidden">
                                {libro.portada ? (
                                    <img src={libro.portada} alt={libro.titulo} className="w-full h-48 object-cover" />
                                ) : (
                                    <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                                        Sin portada
                                    </div>
                                )}
                                <div className="p-2">
                                    <p className="text-sm text-gray-200 truncate group-hover:text-amber-400">{libro.titulo}</p>
                                    <p className="text-xs text-gray-500 truncate">{libro.nombreAutor}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Reseñas populares */}
            <div className="mb-10">
                <h2 className="text-xl font-bold text-amber-400 mb-4">Reseñas recientes</h2>
                {populares.length === 0 ? (
                    <p className="text-gray-500">Aún no hay reseñas</p>
                ) : (
                    <div className="space-y-4">
                        {populares.map((resena) => (
                            <div key={resena.idresena} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-amber-400 font-medium">{resena.nombreUsuario}</span>
                                        <span className="text-gray-500 text-sm">sobre</span>
                                        <Link to={`/libro/${resena.idlibro}`} className="text-gray-200 hover:text-amber-400 font-medium">
                                            {resena.tituloLibro}
                                        </Link>
                                    </div>
                                    <span className="text-amber-400">{'★'.repeat(Math.floor(resena.puntuacion))} {resena.puntuacion}</span>
                                </div>
                                {resena.tieneSpoiler ? (
                                    <p className="text-gray-500 italic">Esta reseña contiene spoilers</p>
                                ) : (
                                    <p className="text-gray-300 line-clamp-2">{resena.texto}</p>
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

            {/* CTA final — solo si no logueado */}
            {!usuario && (
                <div className="text-center py-10 bg-gray-900 rounded-lg border border-amber-500/20">
                    <h2 className="text-2xl font-bold text-amber-400 mb-2">Únete a la comunidad</h2>
                    <p className="text-gray-400 mb-4">Lleva tus lecturas al siguiente nivel</p>
                    <Link to="/registro"
                          className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-6 py-2 rounded-lg">
                        Crear cuenta gratis
                    </Link>
                </div>
            )}
        </div>
    )
}