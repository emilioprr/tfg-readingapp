import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { X } from '@phosphor-icons/react'
import Portada from '../components/Portada'
import { useAvisos } from '../context/AvisosContext'

export default function EnviarRecomendacion() {
    const { avisarCarga } = useAvisos()
    const { idlibro } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [libro, setLibro] = useState(null)
    const [seguidos, setSeguidos] = useState([])
    const [receptorId, setReceptorId] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')

    const cargarLibro = useCallback(async () => { try { const res = await api.get(`/libros/${idlibro}`); setLibro(res.data) } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar el libro.') } }, [avisarCarga, idlibro])
    // Solo se puede recomendar a mutuals: personas a las que sigues y que te siguen
    const cargarSeguidos = useCallback(async () => {
        try {
            const [seguidosRes, seguidoresRes] = await Promise.all([
                api.get(`/usuarios/${usuario.id}/seguidos`),
                api.get(`/usuarios/${usuario.id}/seguidores`),
            ])
            const meSiguen = new Set((seguidoresRes.data || []).map(u => u.idusuario))
            setSeguidos((seguidosRes.data || []).filter(u => meSiguen.has(u.idusuario)))
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar tus contactos.') }
    }, [avisarCarga, usuario])

    useEffect(() => { cargarLibro(); cargarSeguidos() }, [cargarLibro, cargarSeguidos, idlibro])

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('')
        if (!receptorId) { setError('Selecciona un usuario'); return }
        try {
            await api.post('/recomendaciones', { idlibro: parseInt(idlibro), idusuarioEmisor: usuario.id, idusuarioReceptor: parseInt(receptorId), mensaje })
            navigate(`/libro/${idlibro}`)
        } catch (err) { setError(err.response?.data?.mensaje || 'Error al enviar') }
    }

    if (!libro) return <p className="text-texto-sec">Cargando…</p>

    return (
        <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-serif text-4xl leading-none text-texto">Recomendar libro</h1>
                <button onClick={() => navigate(-1)} className="text-texto-sec hover:text-texto" aria-label="Cerrar"><X size={22} /></button>
            </div>
            <div className="flex gap-4 mb-6">
                <Portada src={libro.portada} titulo={libro.titulo} autor={libro.nombreAutor} id={libro.idlibro} elevar={false} className="w-20 flex-shrink-0" />
                <div><h2 className="font-serif text-2xl leading-tight text-texto">{libro.titulo}</h2><p className="text-texto-sec text-sm mt-1">{libro.nombreAutor}</p></div>
            </div>
            {error && <p className="text-error text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="etiqueta block mb-2">¿A quién se lo recomiendas?</label>
                    {seguidos.length === 0 ? (
                        <p className="text-texto-sec text-sm">
                            Solo puedes recomendar a personas que os seguís mutuamente, y todavía no tienes a nadie así. Sigue a quien te sigue y aparecerá aquí.
                        </p>
                    ) : (
                        <select value={receptorId} onChange={(e) => setReceptorId(e.target.value)} aria-label="A quién se lo recomiendas"
                                className="campo">
                            <option value="">Seleccionar…</option>
                            {seguidos.map((u) => <option key={u.idusuario} value={u.idusuario}>{u.nombre}</option>)}
                        </select>
                    )}
                </div>
                <div>
                    <label className="etiqueta block mb-2">Mensaje (opcional)</label>
                    <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3}
                              className="campo" placeholder="Por qué crees que le va a gustar…" />
                </div>
                <button type="submit" className="w-full btn-acento">Enviar recomendación</button>
            </form>
        </div>
    )
}