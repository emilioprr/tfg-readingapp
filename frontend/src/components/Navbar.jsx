import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    MagnifyingGlass, EnvelopeSimple, CaretDown, List, X, User, Users, Bell, Star, Books,
    Heart, GearSix, SignOut, ShieldCheck,
} from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { RachaNavbar } from './Racha'
import { useNotificaciones } from '../context/NotificacionesContext'

// Enlaces principales. Sin sesión solo se muestra lo que funciona sin cuenta: libros y reseñas públicas.
const PRINCIPALES = [
    { ruta: '/catalogo', nombre: 'Explorar', publica: true },
    { ruta: '/resenas', nombre: 'Reseñas', publica: true },
    { ruta: '/citas', nombre: 'Citas' },
    { ruta: '/listas', nombre: 'Listas' },
    { ruta: '/retos', nombre: 'Retos' },
    { ruta: '/calendario', nombre: 'Calendario' },
    { ruta: '/timer', nombre: 'Sesión de lectura' },
]

const claseEnlace = ({ isActive }) =>
    `text-sm whitespace-nowrap transition-colors ${isActive ? 'text-acento' : 'text-texto-sec hover:text-texto'}`

/** Cierra un desplegable al hacer clic fuera de él. */
function useClicFuera(ref, alSalir) {
    useEffect(() => {
        const manejar = (e) => { if (ref.current && !ref.current.contains(e.target)) alSalir() }
        document.addEventListener('mousedown', manejar)
        return () => document.removeEventListener('mousedown', manejar)
    }, [ref, alSalir])
}

function Buscador({ onBuscar, autoFocus = false, className = '' }) {
    const [texto, setTexto] = useState('')
    const enviar = (e) => {
        e.preventDefault()
        if (!texto.trim()) return
        onBuscar(texto)
        setTexto('')
    }
    return (
        <form onSubmit={enviar} role="search" className={`relative ${className}`}>
            <MagnifyingGlass aria-hidden size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-ter pointer-events-none" />
            <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus={autoFocus}
                   placeholder="Libros, autores o usuarios" aria-label="Buscar libros, autores o usuarios"
                   className="w-full bg-superficie border border-linea rounded pl-9 pr-3 py-1.5 text-sm text-texto placeholder-texto-ter focus:border-acento focus:outline-none" />
        </form>
    )
}

function ElementoMenu({ icono: Icono, children, onClick, peligro = false, extra }) {
    return (
        <button onClick={onClick}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-superficie-alta ${peligro ? 'text-error' : 'text-texto'}`}>
            <Icono aria-hidden size={16} className={peligro ? '' : 'text-texto-sec'} />
            {children}
            {extra}
        </button>
    )
}

export default function Navbar() {
    const { usuario, logout } = useAuth()
    const [avatar, setAvatar] = useState(null)
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
    const [buscadorMovil, setBuscadorMovil] = useState(false)
    const { numNoLeidas: noLeidas } = useNotificaciones()
    const menuRef = useRef()
    const navigate = useNavigate()
    const location = useLocation()

    // Al cambiar de página se cierran los menús
    useEffect(() => {
        setMenuMovilAbierto(false)
        setBuscadorMovil(false)
    }, [location.pathname])

    useClicFuera(menuRef, useCallback(() => setMenuAbierto(false), []))

    const cargarAvatar = useCallback(async () => {
        try {
            const res = await api.get(`/usuarios/${usuario.id}`)
            setAvatar(res.data.avatar)
        } catch (err) {
            console.error('Error cargando avatar:', err)
        }
    }, [usuario])

    useEffect(() => {
        if (usuario) cargarAvatar()
    }, [cargarAvatar, usuario])

    const buscar = (texto) => navigate(`/buscar?q=${encodeURIComponent(texto)}`)

    const irA = (ruta) => {
        setMenuAbierto(false)
        navigate(ruta)
    }

    const principales = PRINCIPALES.filter(e => usuario || e.publica)

    return (
        <nav className="bg-fondo border-b border-linea sticky top-0 z-50 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto h-14 flex items-center gap-6">
                {/* Logo: la cinta del marcapáginas y el nombre en serif */}
                <Link to="/" className="flex items-center gap-2 flex-shrink-0 text-texto hover:text-texto" aria-label="Bookmark, inicio">
                    <span className="font-serif text-2xl leading-none tracking-tight">Bookmark</span>
                </Link>

                {/* Enlaces principales (pantallas grandes) */}
                <div className="hidden lg:flex items-center gap-4 xl:gap-6">
                    {principales.map((e) => (
                        <NavLink key={e.ruta} to={e.ruta} className={claseEnlace}>{e.nombre}</NavLink>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-3 sm:gap-5 min-w-0">
                    {/* Buscador visible en pantallas grandes; en móvil, un botón que lo abre debajo */}
                    <Buscador onBuscar={buscar} className="hidden lg:block w-44 xl:w-64" />
                    <button onClick={() => setBuscadorMovil(v => !v)} className="lg:hidden text-texto-sec hover:text-texto"
                            aria-label="Buscar" aria-expanded={buscadorMovil}>
                        <MagnifyingGlass size={20} />
                    </button>

                    {usuario ? (
                        <>
                            <RachaNavbar />

                            <Link to="/recomendaciones" className="hidden sm:block text-texto-sec hover:text-texto" title="Recomendaciones" aria-label="Recomendaciones">
                                <EnvelopeSimple size={20} />
                            </Link>

                            {/* Avatar con su menú; el punto avisa de notificaciones sin leer (están dentro) */}
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setMenuAbierto(v => !v)} aria-expanded={menuAbierto} aria-label="Tu menú"
                                        className="flex items-center gap-1 relative">
                                    {avatar ? (
                                        <img src={avatar} alt={usuario.nombre} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <span className="w-8 h-8 bg-superficie border border-linea rounded-full flex items-center justify-center text-texto-sec text-sm font-serif">
                                            {usuario.nombre?.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                    {noLeidas > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-acento rounded-full border-2 border-fondo" />
                                    )}
                                    <CaretDown aria-hidden size={12} className={`hidden sm:block text-texto-sec transition-transform duration-200 ${menuAbierto ? 'rotate-180' : ''}`} />
                                </button>

                                {menuAbierto && (
                                    <div className="absolute right-0 top-11 bg-superficie border border-linea rounded w-60 py-1 z-50">
                                        <div className="px-4 py-3 border-b border-linea mb-1">
                                            <p className="text-texto text-sm truncate">{usuario.nombre}</p>
                                            <p className="text-texto-ter text-xs truncate">{usuario.email}</p>
                                        </div>
                                        <ElementoMenu icono={User} onClick={() => irA('/perfil')}>Perfil</ElementoMenu>
                                        <ElementoMenu icono={Users} onClick={() => irA('/conexiones')}>Seguidores y seguidos</ElementoMenu>
                                        <ElementoMenu icono={Bell} onClick={() => irA('/notificaciones')}
                                                      extra={noLeidas > 0 && (
                                                          <span className="ml-auto min-w-5 h-5 px-1 bg-acento rounded-full flex items-center justify-center text-fondo text-xs font-medium">
                                                              {noLeidas > 9 ? '9+' : noLeidas}
                                                          </span>
                                                      )}>
                                            Notificaciones
                                        </ElementoMenu>
                                        <ElementoMenu icono={Star} onClick={() => irA('/mis-resenas')}>Mis reseñas</ElementoMenu>
                                        <ElementoMenu icono={Books} onClick={() => irA('/perfil?tab=estanteria')}>Estantería</ElementoMenu>
                                        <ElementoMenu icono={Heart} onClick={() => irA('/mis-likes')}>Lo que me gusta</ElementoMenu>
                                        <div className="border-t border-linea my-1" />
                                        {usuario.rol === 'ADMIN' && (
                                            <ElementoMenu icono={ShieldCheck} onClick={() => irA('/admin')}>Administración</ElementoMenu>
                                        )}
                                        <ElementoMenu icono={GearSix} onClick={() => irA('/ajustes')}>Ajustes</ElementoMenu>
                                        <ElementoMenu icono={SignOut} peligro onClick={() => { setMenuAbierto(false); logout() }}>
                                            Cerrar sesión
                                        </ElementoMenu>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-texto-sec hover:text-texto text-sm whitespace-nowrap">Iniciar sesión</Link>
                            <Link to="/registro" className="hidden sm:inline-block bg-texto hover:bg-texto/90 text-fondo px-4 py-1.5 rounded text-sm">
                                Crear cuenta
                            </Link>
                        </>
                    )}

                    {/* Menú de secciones en móvil */}
                    <button onClick={() => setMenuMovilAbierto(v => !v)} className="lg:hidden text-texto-sec hover:text-texto"
                            aria-label="Menú" aria-expanded={menuMovilAbierto}>
                        {menuMovilAbierto ? <X size={22} /> : <List size={22} />}
                    </button>
                </div>
            </div>

            {buscadorMovil && (
                <div className="lg:hidden max-w-7xl mx-auto pb-3">
                    <Buscador onBuscar={buscar} autoFocus />
                </div>
            )}

            {menuMovilAbierto && (
                <div className="lg:hidden max-w-7xl mx-auto pb-3 pt-2 border-t border-linea grid grid-cols-2 gap-x-4">
                    {principales.map((e) => (
                        <NavLink key={e.ruta} to={e.ruta} className={({ isActive }) => `py-2.5 ${claseEnlace({ isActive })}`}>{e.nombre}</NavLink>
                    ))}
                    {usuario && (
                        <>
                            {/* En móvil el sobre no cabe en la barra */}
                            <NavLink to="/recomendaciones" className={({ isActive }) => `sm:hidden py-2.5 ${claseEnlace({ isActive })}`}>Recomendaciones</NavLink>
                        </>
                    )}
                    {!usuario && (
                        <Link to="/registro" className="sm:hidden py-2.5 text-sm text-acento">Crear cuenta</Link>
                    )}
                </div>
            )}
        </nav>
    )
}
