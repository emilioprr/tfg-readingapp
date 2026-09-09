import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function CrearLista() {
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [esPublica, setEsPublica] = useState(true)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('')
        if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
        try {
            await api.post(`/listas/usuario/${usuario.id}`, { nombre, descripcion, esPublica })
            navigate('/listas')
        } catch (err) { setError(err.response?.data?.mensaje || 'Error al crear la lista') }
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-terra tracking-tight">Nueva lista</h1>
                <button onClick={() => navigate(-1)} className="text-dark-muted hover:text-dark-text text-2xl transition-colors">✕</button>
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-dark-muted text-sm mb-1">Nombre</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                           className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" placeholder="Ej: Favoritos de fantasía" required />
                </div>
                <div>
                    <label className="block text-dark-muted text-sm mb-1">Descripción</label>
                    <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3}
                              className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" placeholder="Descripción opcional..." />
                </div>
                <label className="flex items-center gap-2 text-dark-muted text-sm cursor-pointer">
                    <input type="checkbox" checked={esPublica} onChange={(e) => setEsPublica(e.target.checked)} className="accent-terra" />Lista pública
                </label>
                <button type="submit" className="w-full bg-terra hover:bg-terra-hover text-white font-semibold py-2.5 rounded-lg transition-colors">Crear lista</button>
            </form>
        </div>
    )
}