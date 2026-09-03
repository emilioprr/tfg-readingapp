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
        e.preventDefault()
        setError('')

        if (!nombre.trim()) {
            setError('El nombre es obligatorio')
            return
        }

        try {
            await api.post(`/listas/usuario/${usuario.id}`, {
                nombre,
                descripcion,
                esPublica,
            })
            navigate('/perfil')
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al crear la lista')
        }
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-amber-400">Nueva lista</h1>
                <button onClick={() => navigate(-1)}
                        className="text-gray-400 hover:text-gray-200 text-2xl">
                    ✕
                </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-sm mb-1">Nombre</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        placeholder="Ej: Favoritos de fantasía"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">Descripción</label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        placeholder="Descripción opcional..."
                    />
                </div>

                <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
                    <input type="checkbox" checked={esPublica} onChange={(e) => setEsPublica(e.target.checked)}
                           className="accent-amber-500" />
                    Lista pública
                </label>

                <button type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 rounded">
                    Crear lista
                </button>
            </form>
        </div>
    )
}