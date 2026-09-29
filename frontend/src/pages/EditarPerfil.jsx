import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function EditarPerfil() {
    const { usuario, login } = useAuth()
    const navigate = useNavigate()
    const [nombre, setNombre] = useState('')
    const [biografia, setBiografia] = useState('')
    const [avatar, setAvatar] = useState('')
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')

    const cargarPerfil = useCallback(async () => {
        try { const res = await api.get(`/usuarios/${usuario.id}`); setNombre(res.data.nombre || ''); setBiografia(res.data.biografia || ''); setAvatar(res.data.avatar || '') }
        catch (err) { console.error('Error:', err) }
    }, [usuario])

    useEffect(() => { cargarPerfil() }, [cargarPerfil])

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setExito('')
        if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
        try {
            const res = await api.put(`/usuarios/${usuario.id}`, { nombre, biografia, avatar })
            login({ token: localStorage.getItem('token'), idusuario: usuario.id, nombre: res.data.nombre, email: usuario.email, rol: usuario.rol })
            setExito('Perfil actualizado')
        } catch (err) { setError(err.response?.data?.mensaje || 'Error al actualizar') }
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-terra tracking-tight">Editar perfil</h1>
                <button onClick={() => navigate('/perfil')} className="text-dark-muted hover:text-dark-text text-2xl transition-colors">✕</button>
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            {exito && <p className="text-emerald-400 text-sm mb-4">{exito}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-dark-muted text-sm mb-1">Nombre</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                           className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" required />
                </div>
                <div>
                    <label className="block text-dark-muted text-sm mb-1">Biografía</label>
                    <textarea value={biografia} onChange={(e) => setBiografia(e.target.value)} rows={3}
                              className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" placeholder="Cuéntanos sobre ti..." />
                </div>
                <div>
                    <label className="block text-dark-muted text-sm mb-1">URL de avatar</label>
                    <input type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)}
                           className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" placeholder="https://ejemplo.com/foto.jpg" />
                    {avatar && <img src={avatar} alt="Preview" className="w-16 h-16 rounded-full object-cover mt-2" />}
                </div>
                <button type="submit" className="w-full bg-terra hover:bg-terra-hover text-white font-semibold py-2.5 rounded-lg transition-colors">Guardar cambios</button>
            </form>

            <EliminarCuenta />
        </div>
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

    return (
        <div className="mt-12 pt-6 border-t border-dark-border">
            <h2 className="text-sm font-semibold text-red-400 mb-1">Eliminar cuenta</h2>
            <p className="text-dark-muted text-sm mb-4">
                Se borrarán para siempre tu perfil, tus reseñas, anotaciones, listas, estanterías, retos y recomendaciones.
                No se puede deshacer.
            </p>
            {!abierto ? (
                <button onClick={() => setAbierto(true)}
                        className="border border-red-400/40 text-red-400 hover:bg-red-400/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Eliminar mi cuenta
                </button>
            ) : (
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
            )}
        </div>
    )
}