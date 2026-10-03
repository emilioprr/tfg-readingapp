import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const estiloInput = 'campo'

function Seccion({ titulo, descripcion, peligro = false, children }) {
    return (
        <section className="border-t border-linea pt-8 grid sm:grid-cols-[14rem_1fr] gap-x-10 gap-y-4">
            <div>
                <h2 className={`font-serif text-xl ${peligro ? 'text-error' : 'text-texto'}`}>{titulo}</h2>
                {descripcion && <p className="text-texto-sec text-sm mt-1.5 leading-relaxed">{descripcion}</p>}
            </div>
            <div className="min-w-0">{children}</div>
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
        <div className="max-w-3xl mx-auto space-y-10">
            <h1 className="font-serif text-4xl sm:text-5xl leading-none tracking-tight text-texto">Ajustes</h1>

            <Seccion titulo="Tu cuenta">
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                    <dt className="text-texto-sec">Nombre de usuario</dt>
                    <dd className="text-texto">{usuario.nombre}</dd>
                    <dt className="text-texto-sec">Email</dt>
                    <dd className="text-texto break-all">{usuario.email}</dd>
                    {fechaAlta && (
                        <>
                            <dt className="text-texto-sec">Miembro desde</dt>
                            <dd className="text-texto">
                                {new Date(fechaAlta).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </dd>
                        </>
                    )}
                </dl>
                <Link to="/editar-perfil" className="btn-secundario mt-5">
                    Editar perfil (nombre, biografía y foto)
                </Link>
            </Seccion>

            <Seccion titulo="Contraseña" descripcion="Para cambiarla necesitas la contraseña actual.">
                <CambiarPassword />
            </Seccion>

            <Seccion titulo="Sesión">
                <button onClick={logout} className="btn-secundario">
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
        <form onSubmit={cambiar} className="space-y-3 max-w-sm">
            <input type="password" placeholder="Contraseña actual" aria-label="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)}
                   autoComplete="current-password" required className={estiloInput} />
            <input type="password" placeholder="Nueva contraseña (mínimo 6 caracteres)" aria-label="Nueva contraseña" value={nueva} onChange={(e) => setNueva(e.target.value)}
                   autoComplete="new-password" required className={estiloInput} />
            <input type="password" placeholder="Repite la nueva contraseña" aria-label="Repite la nueva contraseña" value={repetida} onChange={(e) => setRepetida(e.target.value)}
                   autoComplete="new-password" required className={estiloInput} />
            {error && <p className="text-error text-sm">{error}</p>}
            {exito && <p className="text-exito text-sm">{exito}</p>}
            <button type="submit" disabled={guardando} className="btn-acento">
                {guardando ? 'Guardando…' : 'Cambiar contraseña'}
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
            <button onClick={() => setAbierto(true)} className="btn border border-error/50 text-error hover:bg-error/10">
                Eliminar mi cuenta
            </button>
        )
    }

    return (
        <form onSubmit={eliminar} className="border border-error/40 rounded p-4 space-y-3 max-w-sm">
            <label className="block text-texto text-sm">Escribe tu contraseña para confirmar</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required
                   autoComplete="current-password"
                   className="campo focus:border-error" />
            {error && <p className="text-error text-sm">{error}</p>}
            <div className="flex gap-3">
                <button type="submit" disabled={borrando || !password}
                        className="btn bg-error text-fondo hover:bg-error/85">
                    {borrando ? 'Eliminando…' : 'Eliminar definitivamente'}
                </button>
                <button type="button" onClick={() => { setAbierto(false); setPassword(''); setError('') }}
                        className="btn-texto px-2">
                    Cancelar
                </button>
            </div>
        </form>
    )
}
