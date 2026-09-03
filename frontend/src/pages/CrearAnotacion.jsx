import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function CrearAnotacion() {
    const { idlibro } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()

    const [libro, setLibro] = useState(null)
    const [anotaciones, setAnotaciones] = useState([])
    const [texto, setTexto] = useState('')
    const [parte, setParte] = useState('')
    const [tipo, setTipo] = useState('NOTA')
    const [esPublica, setEsPublica] = useState(false)
    const [tieneSpoiler, setTieneSpoiler] = useState(false)
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')

    useEffect(() => {
        cargarLibro()
        cargarAnotaciones()
    }, [idlibro])

    const cargarLibro = async () => {
        try {
            const res = await api.get(`/libros/${idlibro}`)
            setLibro(res.data)
        } catch (err) {
            console.error('Error cargando libro:', err)
        }
    }

    const cargarAnotaciones = async () => {
        try {
            const res = await api.get(`/anotaciones/usuario/${usuario.id}/libro/${idlibro}`)
            setAnotaciones(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando anotaciones:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setExito('')

        if (!texto.trim()) {
            setError('El texto es obligatorio')
            return
        }

        try {
            await api.post('/anotaciones', {
                texto,
                parte,
                tipo,
                esPublica,
                tieneSpoiler,
                idlibro: parseInt(idlibro),
                idusuario: usuario.id,
            })
            setExito('Anotación guardada')
            setTexto('')
            setParte('')
            cargarAnotaciones()
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al crear anotación')
        }
    }

    const eliminarAnotacion = async (id) => {
        try {
            await api.delete(`/anotaciones/${id}`)
            cargarAnotaciones()
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error al eliminar')
        }
    }

    if (!libro) return <p className="text-gray-400">Cargando...</p>

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-amber-400">Anotaciones</h1>
                <button onClick={() => navigate(`/libro/${idlibro}`)}
                        className="text-gray-400 hover:text-gray-200 text-2xl">
                    ✕
                </button>
            </div>

            <div className="flex gap-6 mb-8">
                {libro.portada ? (
                    <img src={libro.portada} alt={libro.titulo} className="w-24 h-36 object-cover rounded-lg flex-shrink-0" />
                ) : (
                    <div className="w-24 h-36 bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-500 text-sm">
                        Sin portada
                    </div>
                )}
                <div>
                    <h2 className="text-xl font-bold text-gray-100">{libro.titulo}</h2>
                    <p className="text-gray-400 text-sm">{libro.nombreAutor}</p>
                </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            {exito && <p className="text-green-400 text-sm mb-4">{exito}</p>}

            <form onSubmit={handleSubmit} className="bg-gray-900 p-4 rounded-lg border border-gray-800 mb-8 space-y-4">
                <div className="flex gap-3">
                    <button type="button" onClick={() => setTipo('NOTA')}
                            className={`px-4 py-2 rounded text-sm font-medium ${
                                tipo === 'NOTA' ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-400'
                            }`}>
                        📝 Nota
                    </button>
                    <button type="button" onClick={() => setTipo('CITA')}
                            className={`px-4 py-2 rounded text-sm font-medium ${
                                tipo === 'CITA' ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-400'
                            }`}>
                        💬 Cita
                    </button>
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">Parte del libro (opcional)</label>
                    <input
                        type="text"
                        value={parte}
                        onChange={(e) => setParte(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        placeholder="Ej: Capítulo 3, página 42"
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">
                        {tipo === 'NOTA' ? 'Tu nota' : 'La cita'}
                    </label>
                    <textarea
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        placeholder={tipo === 'NOTA' ? 'Escribe tu nota...' : 'Escribe la cita del libro...'}
                        required
                    />
                </div>

                <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
                        <input type="checkbox" checked={esPublica} onChange={(e) => setEsPublica(e.target.checked)}
                               className="accent-amber-500" />
                        Pública
                    </label>
                    <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
                        <input type="checkbox" checked={tieneSpoiler} onChange={(e) => setTieneSpoiler(e.target.checked)}
                               className="accent-amber-500" />
                        Contiene spoiler
                    </label>
                </div>

                <button type="submit"
                        className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-6 py-2 rounded">
                    Guardar anotación
                </button>
            </form>

            {/* Lista de anotaciones */}
            <h3 className="text-lg font-bold text-amber-400 mb-4">Mis anotaciones</h3>
            {anotaciones.length === 0 ? (
                <p className="text-gray-500">No tienes anotaciones en este libro</p>
            ) : (
                <div className="space-y-3">
                    {anotaciones.map((a) => (
                        <div key={a.idanotacion} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                      a.tipo === 'CITA' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {a.tipo === 'CITA' ? '💬 Cita' : '📝 Nota'}
                  </span>
                                    {a.parte && <span className="text-xs text-gray-500">{a.parte}</span>}
                                    {a.tieneSpoiler && <span className="text-xs text-red-400">Spoiler</span>}
                                </div>
                                <button onClick={() => eliminarAnotacion(a.idanotacion)}
                                        className="text-gray-500 hover:text-red-400 text-sm">
                                    ✕
                                </button>
                            </div>
                            <p className={`${a.tipo === 'CITA' ? 'italic text-amber-200' : 'text-gray-300'}`}>
                                {a.tipo === 'CITA' ? `"${a.texto}"` : a.texto}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">{new Date(a.fecha).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}