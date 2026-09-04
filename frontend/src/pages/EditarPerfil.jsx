import { useState, useEffect } from 'react'
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

    useEffect(() => { cargarPerfil() }, [])
    const cargarPerfil = async () => {
        try { const res = await api.get(`/usuarios/${usuario.id}`); setNombre(res.data.nombre || ''); setBiografia(res.data.biografia || ''); setAvatar(res.data.avatar || '') }
        catch (err) { console.error('Error:', err) }
    }

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
        </div>
    )
}