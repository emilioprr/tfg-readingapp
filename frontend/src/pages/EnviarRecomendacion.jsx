import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function EnviarRecomendacion() {
    const { idlibro } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()

    const [libro, setLibro] = useState(null)
    const [seguidos, setSeguidos] = useState([])
    const [receptorId, setReceptorId] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        cargarLibro()
        cargarSeguidos()
    }, [idlibro])

    const cargarLibro = async () => {
        try {
            const res = await api.get(`/libros/${idlibro}`)
            setLibro(res.data)
        } catch (err) {
            console.error('Error cargando libro:', err)
        }
    }

    const cargarSeguidos = async () => {
        try {
            const res = await api.get(`/usuarios/${usuario.id}/seguidos`)
            setSeguidos(res.data || [])
        } catch (err) {
            console.error('Error cargando seguidos:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!receptorId) {
            setError('Selecciona un usuario')
            return
        }

        try {
            await api.post('/recomendaciones', {
                idlibro: parseInt(idlibro),
                idusuarioEmisor: usuario.id,
                idusuarioReceptor: parseInt(receptorId),
                mensaje,
            })
            navigate(`/libro/${idlibro}`)
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al enviar recomendación')
        }
    }

    if (!libro) return <p className="text-gray-400">Cargando...</p>

    return (
        <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-amber-400">Recomendar libro</h1>
                <button onClick={() => navigate(-1)}
                        className="text-gray-400 hover:text-gray-200 text-2xl">
                    ✕
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                {libro.portada ? (
                    <img src={libro.portada} alt={libro.titulo} className="w-20 h-28 object-cover rounded" />
                ) : (
                    <div className="w-20 h-28 bg-gray-800 rounded flex items-center justify-center text-gray-500 text-xs">
                        Sin portada
                    </div>
                )}
                <div>
                    <h2 className="text-lg font-bold text-gray-100">{libro.titulo}</h2>
                    <p className="text-gray-400 text-sm">{libro.nombreAutor}</p>
                </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-sm mb-1">¿A quién se lo recomiendas?</label>
                    {seguidos.length === 0 ? (
                        <p className="text-gray-500 text-sm">No sigues a ningún usuario todavía</p>
                    ) : (
                        <select value={receptorId} onChange={(e) => setReceptorId(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none">
                            <option value="">Seleccionar usuario...</option>
                            {seguidos.map((u) => (
                                <option key={u.idusuario} value={u.idusuario}>{u.nombre}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">Mensaje (opcional)</label>
                    <textarea
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        placeholder="¿Por qué se lo recomiendas?"
                    />
                </div>

                <button type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 rounded">
                    Enviar recomendación
                </button>
            </form>
        </div>
    )
}