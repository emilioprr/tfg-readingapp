import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const estiloInput = 'w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors'

function Seccion({ titulo, descripcion, peligro = false, children }) {
    return (
        <section className={`bg-dark-card rounded-2xl p-6 ${peligro ? 'border border-red-400/20' : ''}`}>
            <h2 className={`text-base font-semibold ${peligro ? 'text-red-400' : 'text-dark-text'}`}>{titulo}</h2>
            {descripcion && <p className="text-dark-muted text-sm mt-1">{descripcion}</p>}
            <div className="mt-4">{children}</div>
        </section>
    )
}

/** Ajustes de la cuenta: datos, contraseña, sesión y baja. */
export default function Ajustes() {
    const { usuario, logout } = useAuth()
    const [fechaAlta, setFechaAlta] = useState(null)

    useEffect(() => {
        if (!usuario) return
        api.get(`/usuarios/${usuario.id}`)
            .then(res => setFechaAlta(res.data.fechaAlta))
            .catch(err => console.error('Error:', err))
    }, [usuario])

    if (!usuario) return <Navigate to="/login" />

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            <h1 className="text-2xl font-bold text-dark-text tracking-tight mb-2">Ajustes</h1>

            <Seccion titulo="Tu cuenta">
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                    <dt className="text-dark-muted">Nombre de usuario</dt>
                    <dd className="text-dark-text">{usuario.nombre}</dd>
                    <dt className="text-dark-muted">Email</dt>
                    <dd className="text-dark-text break-all">{usuario.email}</dd>
                    {fechaAlta && (
                        <>
                            <dt className="text-dark-muted">Miembro desde</dt>
                            <dd className="text-dark-text">
                                {new Date(fechaAlta).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </dd>
                        </>
                    )}
                </dl>
                <Link to="/editar-perfil"
                      className="inline-block mt-4 border border-dark-border text-dark-muted hover:border-terra hover:text-terra px-4 py-1.5 rounded-lg text-sm transition-colors">
                    Editar perfil (nombre, biografía y foto)
                </Link>
            </Seccion>

            <Seccion titulo="Contraseña" descripcion="Para cambiarla necesitas la contraseña actual.">
                <CambiarPassword />
            </Seccion>

            <Seccion titulo="Sesión">
                <button onClick={logout}
                        className="border border-dark-border text-dark-muted hover:border-terra hover:text-terra px-4 py-1.5 rounded-lg text-sm transition-colors">
                    Cerrar sesión
                </button>
            </Seccion>

            <Seccion titulo="Eliminar cuenta" peligro
                     descripcion="Se borrarán para siempre tu perfil, tus reseñas, anotaciones, listas, estanterías, retos y recomendaciones. No se puede deshacer.">
                <EliminarCuenta />
            </Seccion>
        </div>
    )
}

function CambiarPassword() {
    const { usuario } = useAuth()
    const [actual, setActual] = useState('')
    const [nueva, setNueva] = useState('')
    const [repetida, setRepetida] = useState('')
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')
    const [guardando, setGuardando] = useState(false)

    const cambiar = async (e) => {
        e.preventDefault()
        setError('')
        setExito('')
        if (nueva.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres'); return }
        if (nueva !== repetida) { setError('Las contraseñas nuevas no coinciden'); return }
        setGuardando(true)
        try {
            await api.put(`/usuarios/${usuario.id}/password`, { actual, nueva })
            setExito('Contraseña cambiada')
            setActual(''); setNueva(''); setRepetida('')
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se ha podido cambiar la contraseña')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <form onSubmit={cambiar} className="space-y-3">
            <input type="password" placeholder="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)}
                   autoComplete="current-password" required className={estiloInput} />
            <input type="password" placeholder="Nueva contraseña (mínimo 6 caracteres)" value={nueva} onChange={(e) => setNueva(e.target.value)}
                   autoComplete="new-password" required className={estiloInput} />
            <input type="password" placeholder="Repite la nueva contraseña" value={repetida} onChange={(e) => setRepetida(e.target.value)}
                   autoComplete="new-password" required className={estiloInput} />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {exito && <p className="text-emerald-400 text-sm">{exito}</p>}
            <button type="submit" disabled={guardando}
                    className="bg-terra hover:bg-terra-hover text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
        </form>
    )
}

/** Baja de la cuenta: pide la contraseña y borra todos los datos del usuario. */
function EliminarCuenta() {
    const { usuario, logout } = useAuth()
    const [abierto, setAbierto] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [borrando, setBorrando] = useState(false)

    const eliminar = async (e) => {
        e.preventDefault()
        setError('')
        setBorrando(true)
        try {
            await api.post(`/usuarios/${usuario.id}/eliminar-cuenta`, { password })
            logout() // limpia la sesión y vuelve a la portada
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se ha podido eliminar la cuenta')
            setBorrando(false)
        }
    }

    if (!abierto) {
        return (
            <button onClick={() => setAbierto(true)}
                    className="border border-red-400/40 text-red-400 hover:bg-red-400/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Eliminar mi cuenta
            </button>
        )
    }

    return (
        <form onSubmit={eliminar} className="bg-red-400/5 border border-red-400/30 rounded-xl p-4 space-y-3">
            <label className="block text-dark-text text-sm">Escribe tu contraseña para confirmar</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required
                   autoComplete="current-password"
                   className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-red-400 focus:outline-none transition-colors" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
                <button type="submit" disabled={borrando || !password}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                    {borrando ? 'Eliminando...' : 'Eliminar definitivamente'}
                </button>
                <button type="button" onClick={() => { setAbierto(false); setPassword(''); setError('') }}
                        className="text-dark-muted hover:text-dark-text px-3 py-2 text-sm transition-colors">
                    Cancelar
                </button>
            </div>
        </form>
    )
}
