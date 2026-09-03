import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Navbar() {
    const { usuario, logout } = useAuth()
    const [avatar, setAvatar] = useState(null)

    useEffect(() => {
        if (usuario) {
            cargarAvatar()
        }
    }, [usuario])

    const cargarAvatar = async () => {
        try {
            const res = await api.get(`/usuarios/${usuario.id}`)
            setAvatar(res.data.avatar)
        } catch (err) {
            console.error('Error cargando avatar:', err)
        }
    }

    return (
        <nav className="bg-gray-900 border-b border-amber-500/20 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/" className="text-amber-400 text-xl font-bold">
                    ReadingApp
                </Link>
                <div className="flex items-center gap-6">
                    <Link to="/catalogo" className="text-gray-300 hover:text-amber-400">
                        Catálogo
                    </Link>
                    {usuario ? (
                        <>
                            <Link to="/retos" className="text-gray-300 hover:text-amber-400">
                                Retos
                            </Link>
                            <Link to="/recomendaciones" className="text-gray-300 hover:text-amber-400">
                                Recomendaciones
                            </Link>
                            <Link to="/buscar-usuarios" className="text-gray-300 hover:text-amber-400">
                                Comunidad
                            </Link>
                            <Link to="/notificaciones" className="text-gray-300 hover:text-amber-400">
                                Notificaciones
                            </Link>
                            {usuario.rol === 'ADMIN' && (
                                <Link to="/admin" className="text-gray-300 hover:text-amber-400">
                                    Admin
                                </Link>
                            )}
                            <Link to="/perfil">
                                {avatar ? (
                                    <img src={avatar} alt={usuario.nombre} className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-amber-400" />
                                ) : (
                                    <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-sm font-bold hover:ring-2 hover:ring-amber-400">
                                        {usuario.nombre?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Link>
                            <button onClick={logout} className="text-gray-400 hover:text-red-400" title="Cerrar sesión">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="text-amber-400 hover:text-amber-300">
                            Iniciar sesión
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}