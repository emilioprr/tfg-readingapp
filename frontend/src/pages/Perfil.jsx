import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Perfil() {
    const { usuario } = useAuth()
    const [perfil, setPerfil] = useState(null)
    const [leyendo, setLeyendo] = useState([])
    const [resenas, setResenas] = useState([])
    const [listas, setListas] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (usuario) {
            cargarPerfil()
            cargarLeyendo()
            cargarResenas()
            cargarListas()
        }
    }, [usuario])

    const cargarPerfil = async () => {
        try {
            const res = await api.get(`/usuarios/${usuario.id}`)
            setPerfil(res.data)
        } catch (err) {
            console.error('Error cargando perfil:', err)
        } finally {
            setLoading(false)
        }
    }

    const cargarLeyendo = async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/estado/LEYENDO`)
            setLeyendo(res.data || [])
        } catch (err) {
            console.error('Error cargando leyendo:', err)
        }
    }

    const cargarResenas = async () => {
        try {
            const res = await api.get(`/resenas/usuario/${usuario.id}?size=5`)
            setResenas(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando reseñas:', err)
        }
    }

    const cargarListas = async () => {
        try {
            const res = await api.get(`/listas/usuario/${usuario.id}`)
            setListas(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando listas:', err)
        }
    }

    if (loading) return <p className="text-gray-400">Cargando...</p>
    if (!perfil) return <p className="text-red-400">Error cargando perfil</p>

    return (
        <div>
            {/* Cabecera del perfil */}
            <div className="bg-gray-900 rounded-lg border border-amber-500/20 p-6 mb-6">
                <div className="flex items-center gap-6">
                    {perfil.avatar ? (
                        <img src={perfil.avatar} alt={perfil.nombre} className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                        <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-3xl font-bold">
                            {perfil.nombre?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-amber-400">{perfil.nombre}</h1>
                            <Link to="/editar-perfil" className="text-sm text-gray-400 hover:text-amber-400">
                                Editar
                            </Link>
                        </div>
                        <p className="text-gray-400">{perfil.email}</p>
                        {perfil.biografia && <p className="text-gray-300 mt-1">{perfil.biografia}</p>}
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>{perfil.seguidores || 0} seguidores</span>
                            <span>Miembro desde {perfil.fechaAlta}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leyendo actualmente */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-amber-400 mb-4">Leyendo ahora</h2>
                {leyendo.length === 0 ? (
                    <p className="text-gray-500">No estás leyendo ningún libro</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {leyendo.map((s) => (
                            <Link key={s.idseguimiento} to={`/libro/${s.idlibro}`} className="group">
                                <div className="bg-gray-900 rounded-lg border border-gray-800 hover:border-amber-500/40 p-3">
                                    <p className="text-sm text-gray-200 truncate group-hover:text-amber-400">{s.tituloLibro}</p>
                                    <div className="mt-2 bg-gray-800 rounded-full h-2">
                                        <div
                                            className="bg-amber-500 h-2 rounded-full"
                                            style={{ width: `${s.porcentaje || 0}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{s.porcentaje || 0}% · Pág {s.numPagina}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Listas */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-amber-400">Mis listas</h2>
                    <Link to="/crear-lista" className="text-sm bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-3 py-1 rounded">
                        + Nueva lista
                    </Link>
                </div>                {listas.length === 0 ? (
                    <p className="text-gray-500">No tienes listas todavía</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {listas.map((lista) => (
                            <Link key={lista.idlista} to={`/lista/${lista.idlista}`}
                                  className="bg-gray-900 rounded-lg border border-gray-800 hover:border-amber-500/40 p-4">
                                <p className="text-amber-400 font-medium">{lista.nombre}</p>
                                {lista.descripcion && <p className="text-gray-400 text-sm mt-1 truncate">{lista.descripcion}</p>}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Reseñas recientes */}
            <div>
                <h2 className="text-xl font-bold text-amber-400 mb-4">Mis reseñas</h2>
                {resenas.length === 0 ? (
                    <p className="text-gray-500">No has escrito reseñas todavía</p>
                ) : (
                    <div className="space-y-4">
                        {resenas.map((resena) => (
                            <div key={resena.idresena} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <Link to={`/libro/${resena.idlibro}`} className="text-amber-400 font-medium hover:underline">
                                        {resena.tituloLibro}
                                    </Link>
                                    <span className="text-amber-400">{'★'.repeat(Math.floor(resena.puntuacion))} {resena.puntuacion}</span>
                                </div>
                                <p className="text-gray-300">{resena.texto}</p>
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
        </div>
    )
}