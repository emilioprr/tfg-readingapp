import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function UsuarioPerfil() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const [perfil, setPerfil] = useState(null)
    const [resenas, setResenas] = useState([])
    const [siguiendo, setSiguiendo] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarPerfil()
        cargarResenas()
    }, [id])

    const cargarPerfil = async () => {
        try {
            const res = await api.get(`/usuarios/${id}`)
            setPerfil(res.data)
        } catch (err) {
            console.error('Error cargando perfil:', err)
        } finally {
            setLoading(false)
        }
    }

    const cargarResenas = async () => {
        try {
            const res = await api.get(`/resenas/usuario/${id}/publicas?size=10`)
            setResenas(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando reseñas:', err)
        }
    }

    const toggleSeguir = async () => {
        try {
            if (siguiendo) {
                await api.delete(`/usuarios/${usuario.id}/seguir/${id}`)
            } else {
                await api.post(`/usuarios/${usuario.id}/seguir/${id}`)
            }
            setSiguiendo(!siguiendo)
            cargarPerfil()
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error')
        }
    }

    if (loading) return <p className="text-gray-400">Cargando...</p>
    if (!perfil) return <p className="text-red-400">Usuario no encontrado</p>

    const esMio = usuario && usuario.id === parseInt(id)

    return (
        <div>
            <div className="bg-gray-900 rounded-lg border border-amber-500/20 p-6 mb-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-3xl font-bold">
                        {perfil.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-amber-400">{perfil.nombre}</h1>
                        {perfil.biografia && <p className="text-gray-300 mt-1">{perfil.biografia}</p>}
                        <p className="text-sm text-gray-500 mt-1">{perfil.seguidores || 0} seguidores</p>
                        {usuario && !esMio && (
                            <button onClick={toggleSeguir}
                                    className={`mt-2 px-4 py-1 rounded text-sm font-bold ${
                                        siguiendo
                                            ? 'border border-amber-500/40 text-amber-400 hover:bg-red-500/10 hover:text-red-400'
                                            : 'bg-amber-500 hover:bg-amber-600 text-gray-900'
                                    }`}>
                                {siguiendo ? 'Dejar de seguir' : 'Seguir'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {esMio ? (
                <p className="text-gray-400">
                    Este es tu perfil. <Link to="/perfil" className="text-amber-400 hover:underline">Ir a mi perfil</Link>
                </p>
            ) : (
                <div>
                    <h2 className="text-xl font-bold text-amber-400 mb-4">Reseñas públicas</h2>
                    {resenas.length === 0 ? (
                        <p className="text-gray-500">Este usuario no tiene reseñas públicas</p>
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
                                    {resena.tieneSpoiler ? (
                                        <p className="text-gray-500 italic">Esta reseña contiene spoilers</p>
                                    ) : (
                                        <p className="text-gray-300">{resena.texto}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}