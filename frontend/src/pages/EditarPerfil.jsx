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

    useEffect(() => {
        cargarPerfil()
    }, [])

    const cargarPerfil = async () => {
        try {
            const res = await api.get(`/usuarios/${usuario.id}`)
            setNombre(res.data.nombre || '')
            setBiografia(res.data.biografia || '')
            setAvatar(res.data.avatar || '')
        } catch (err) {
            console.error('Error cargando perfil:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setExito('')

        if (!nombre.trim()) {
            setError('El nombre es obligatorio')
            return
        }

        try {
            const res = await api.put(`/usuarios/${usuario.id}`, {
                nombre,
                biografia,
                avatar,
            })
            login({
                token: localStorage.getItem('token'),
                idusuario: usuario.id,
                nombre: res.data.nombre,
                email: usuario.email,
                rol: usuario.rol,
            })
            setExito('Perfil actualizado')
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al actualizar perfil')
        }
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-amber-400">Editar perfil</h1>
                <button onClick={() => navigate('/perfil')}
                        className="text-gray-400 hover:text-gray-200 text-2xl">
                    ✕
                </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            {exito && <p className="text-green-400 text-sm mb-4">{exito}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-sm mb-1">Nombre</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">Biografía</label>
                    <textarea
                        value={biografia}
                        onChange={(e) => setBiografia(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        placeholder="Cuéntanos sobre ti..."
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">URL de avatar</label>
                    <input
                        type="url"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        placeholder="https://ejemplo.com/mi-foto.jpg"
                    />
                    {avatar && (
                        <img src={avatar} alt="Preview" className="w-16 h-16 rounded-full object-cover mt-2" />
                    )}
                </div>

                <button type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 rounded">
                    Guardar cambios
                </button>
            </form>
        </div>
    )
}