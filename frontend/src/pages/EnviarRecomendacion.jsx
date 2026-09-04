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

    useEffect(() => { cargarLibro(); cargarSeguidos() }, [idlibro])
    const cargarLibro = async () => { try { const res = await api.get(`/libros/${idlibro}`); setLibro(res.data) } catch (err) { console.error('Error:', err) } }
    const cargarSeguidos = async () => { try { const res = await api.get(`/usuarios/${usuario.id}/seguidos`); setSeguidos(res.data || []) } catch (err) { console.error('Error:', err) } }

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('')
        if (!receptorId) { setError('Selecciona un usuario'); return }
        try {
            await api.post('/recomendaciones', { idlibro: parseInt(idlibro), idusuarioEmisor: usuario.id, idusuarioReceptor: parseInt(receptorId), mensaje })
            navigate(`/libro/${idlibro}`)
        } catch (err) { setError(err.response?.data?.mensaje || 'Error al enviar') }
    }

    if (!libro) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-terra tracking-tight">Recomendar libro</h1>
                <button onClick={() => navigate(-1)} className="text-dark-muted hover:text-dark-text text-2xl transition-colors">✕</button>
            </div>
            <div className="flex gap-4 mb-6">
                {libro.portada ? <img src={libro.portada} alt={libro.titulo} className="w-20 h-28 object-cover rounded-xl" />
                    : <div className="w-20 h-28 bg-dark-elevated rounded-xl flex items-center justify-center text-dark-muted text-xs">Sin portada</div>}
                <div><h2 className="text-lg font-bold text-dark-text">{libro.titulo}</h2><p className="text-dark-muted text-sm">{libro.nombreAutor}</p></div>
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-dark-muted text-sm mb-1">¿A quién se lo recomiendas?</label>
                    {seguidos.length === 0 ? <p className="text-dark-muted text-sm">No sigues a nadie</p> : (
                        <select value={receptorId} onChange={(e) => setReceptorId(e.target.value)}
                                className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors">
                            <option value="">Seleccionar...</option>
                            {seguidos.map((u) => <option key={u.idusuario} value={u.idusuario}>{u.nombre}</option>)}
                        </select>
                    )}
                </div>
                <div>
                    <label className="block text-dark-muted text-sm mb-1">Mensaje (opcional)</label>
                    <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3}
                              className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" placeholder="¿Por qué se lo recomiendas?" />
                </div>
                <button type="submit" className="w-full bg-terra hover:bg-terra-hover text-white font-semibold py-2.5 rounded-lg transition-colors">Enviar recomendación</button>
            </form>
        </div>
    )
}