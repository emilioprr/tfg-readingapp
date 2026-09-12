import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import logoBookmark from '../assets/logo.png'

export default function Navbar() {
    const { usuario, logout } = useAuth()
    const [avatar, setAvatar] = useState(null)
    const [busqueda, setBusqueda] = useState('')
    const [buscadorAbierto, setBuscadorAbierto] = useState(false)
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [noLeidas, setNoLeidas] = useState(0)
    const menuRef = useRef()
    const buscadorRef = useRef()
    const inputRef = useRef()
    const navigate = useNavigate()

    useEffect(() => {
        if (usuario) {
            cargarAvatar()
            cargarNoLeidas()
            const interval = setInterval(cargarNoLeidas, 30000)
            return () => clearInterval(interval)
        }
    }, [usuario])

    useEffect(() => {
        const handleClickFuera = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false)
            if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
                if (!busqueda.trim()) setBuscadorAbierto(false)
            }
        }
        document.addEventListener('mousedown', handleClickFuera)
        return () => document.removeEventListener('mousedown', handleClickFuera)
    }, [busqueda])

    useEffect(() => {
        if (buscadorAbierto && inputRef.current) inputRef.current.focus()
    }, [buscadorAbierto])

    const cargarAvatar = async () => {
        try {
            const res = await api.get(`/usuarios/${usuario.id}`)
            setAvatar(res.data.avatar)
        } catch (err) {
            console.error('Error cargando avatar:', err)
        }
    }

    const cargarNoLeidas = async () => {
        try {
            const res = await api.get(`/notificaciones/usuario/${usuario.id}/no-leidas`)
            const datos = res.data.content || res.data || []
            setNoLeidas(typeof datos === 'number' ? datos : datos.length || 0)
        } catch (err) {
            console.error('Error cargando no leídas:', err)
        }
    }

    const handleBuscar = (e) => {
        e.preventDefault()
        if (!busqueda.trim()) return
        navigate(`/buscar?q=${encodeURIComponent(busqueda)}`)
        setBusqueda('')
        setBuscadorAbierto(false)
    }

    const handleMenuClick = (ruta) => {
        setMenuAbierto(false)
        navigate(ruta)
    }

    return (
        <nav className="bg-dark-card/80 backdrop-blur-md border-b border-dark-border sticky top-0 z-50 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <Link to="/" className="text-white text-xl font-bold tracking-tight flex-shrink-0 flex items-center gap-1">
                    Bookmark
                    <img alt="Logo Bookmark" src={logoBookmark} className="w-9 h-9 object-contain" />
                </Link>

                <div className="flex items-center gap-5 flex-shrink-0">
                    {/* Buscador desplegable */}
                    <div className="relative" ref={buscadorRef}>
                        {buscadorAbierto ? (
                            <form onSubmit={handleBuscar} className="flex items-center">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Buscar libros..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-56 bg-dark-elevated border border-dark-border rounded-full pl-4 pr-9 py-1.5 text-sm text-dark-text placeholder-dark-muted focus:border-terra focus:outline-none transition-all"
                                />
                                <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-muted hover:text-terra transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </form>
                        ) : (
                            <button onClick={() => setBuscadorAbierto(true)} className="text-dark-muted hover:text-dark-text transition-colors" title="Buscar">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <Link to="/catalogo" className="text-dark-muted hover:text-dark-text text-sm font-medium transition-colors">Libros</Link>
                    <Link to="/resenas" className="text-dark-muted hover:text-dark-text text-sm font-medium transition-colors">Reseñas</Link>
                    <Link to="/listas" className="text-dark-muted hover:text-dark-text text-sm font-medium transition-colors">Listas</Link>
                    <Link to="/calendario" className="text-dark-muted hover:text-dark-text text-sm font-medium transition-colors">Diario</Link>
                    <Link to="/timer" className="text-dark-muted hover:text-dark-text text-sm font-medium transition-colors">Sesión de Lectura</Link>
                    {usuario ? (
                        <>
                            <Link to="/retos" className="text-dark-muted hover:text-dark-text text-sm font-medium transition-colors">Retos</Link>

                            {usuario.rol === 'ADMIN' && (
                                <Link to="/admin" className="text-dark-muted hover:text-dark-text text-sm font-medium transition-colors">Admin</Link>
                            )}

                            {/* Recomendaciones — avión de papel */}
                            <Link to="/recomendaciones" className="text-dark-muted hover:text-dark-text transition-colors" title="Recomendaciones">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                </svg>
                            </Link>

                            {/* Avatar con desplegable + indicador de notificaciones */}
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setMenuAbierto(!menuAbierto)} className="focus:outline-none flex items-center gap-1 relative">
                                    {avatar ? (
                                        <img src={avatar} alt={usuario.nombre} className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-terra transition-all" />
                                    ) : (
                                        <div className="w-8 h-8 bg-terra/20 rounded-full flex items-center justify-center text-terra text-sm font-bold ring-2 ring-transparent hover:ring-terra transition-all">
                                            {usuario.nombre?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {noLeidas > 0 && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-terra rounded-full border-2 border-dark-card" />
                                    )}
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-dark-muted transition-transform ${menuAbierto ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {menuAbierto && (
                                    <div className="absolute right-0 top-12 bg-dark-card border border-dark-border rounded-xl shadow-2xl w-48 overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-dark-border">
                                            <p className="text-dark-text text-sm font-medium truncate">{usuario.nombre}</p>
                                            <p className="text-dark-muted text-xs truncate">{usuario.email}</p>
                                        </div>
                                        <button onClick={() => handleMenuClick('/perfil')}
                                                className="w-full text-left px-4 py-2.5 text-dark-text hover:bg-dark-elevated text-sm transition-colors flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Perfil
                                        </button>
                                        <button onClick={() => handleMenuClick('/notificaciones')}
                                                className="w-full text-left px-4 py-2.5 text-dark-text hover:bg-dark-elevated text-sm transition-colors flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                            Notificaciones
                                            {noLeidas > 0 && (
                                                <span className="ml-auto w-5 h-5 bg-terra rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {noLeidas > 9 ? '9+' : noLeidas}
                        </span>
                                            )}
                                        </button>
                                        <button onClick={() => handleMenuClick('/mis-resenas')}
                                                className="w-full text-left px-4 py-2.5 text-dark-text hover:bg-dark-elevated text-sm transition-colors flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                            Mis reseñas
                                        </button>
                                        <button onClick={() => handleMenuClick('/mi-wishlist')}
                                                className="w-full text-left px-4 py-2.5 text-dark-text hover:bg-dark-elevated text-sm transition-colors flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                            Wishlist
                                        </button>
                                        <button onClick={() => handleMenuClick('/mis-likes')}
                                                className="w-full text-left px-4 py-2.5 text-dark-text hover:bg-dark-elevated text-sm transition-colors flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            Likes
                                        </button>
                                        <div className="border-t border-dark-border">
                                            <button onClick={() => { setMenuAbierto(false); logout() }}
                                                    className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-dark-elevated text-sm transition-colors flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <Link to="/login" className="text-terra hover:text-terra-hover text-sm font-medium transition-colors">Iniciar sesión</Link>
                    )}
                </div>
            </div>
        </nav>
    )
}