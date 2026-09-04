import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Recomendaciones() {
    const { usuario } = useAuth()
    const [conversaciones, setConversaciones] = useState([])
    const [seleccionado, setSeleccionado] = useState(null)
    const [mensajes, setMensajes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { cargarConversaciones() }, [])

    const cargarConversaciones = async () => {
        try {
            const [recRes, envRes] = await Promise.all([
                api.get(`/recomendaciones/recibidas/${usuario.id}`),
                api.get(`/recomendaciones/enviadas/${usuario.id}`),
            ])
            const todas = [...(recRes.data.content || recRes.data || []), ...(envRes.data.content || envRes.data || [])]
            const mapa = {}
            todas.forEach((r) => {
                const otroId = r.idusuarioEmisor === usuario.id ? r.idusuarioReceptor : r.idusuarioEmisor
                const otroNombre = r.idusuarioEmisor === usuario.id ? r.nombreReceptor : r.nombreEmisor
                if (!mapa[otroId]) mapa[otroId] = { id: otroId, nombre: otroNombre, ultima: r.fecha, count: 0 }
                mapa[otroId].count++
                if (r.fecha > mapa[otroId].ultima) mapa[otroId].ultima = r.fecha
            })
            setConversaciones(Object.values(mapa).sort((a, b) => b.ultima.localeCompare(a.ultima)))
        } catch (err) { console.error('Error:', err) } finally { setLoading(false) }
    }

    const seleccionarUsuario = async (otroUsuario) => {
        setSeleccionado(otroUsuario)
        try {
            const [recRes, envRes] = await Promise.all([
                api.get(`/recomendaciones/recibidas/${usuario.id}`),
                api.get(`/recomendaciones/enviadas/${usuario.id}`),
            ])
            const recibidas = (recRes.data.content || recRes.data || []).map(r => ({ ...r, tipo: 'recibida' }))
            const enviadas = (envRes.data.content || envRes.data || []).map(r => ({ ...r, tipo: 'enviada' }))
            setMensajes([...recibidas, ...enviadas]
                .filter(r => r.idusuarioEmisor === otroUsuario.id || r.idusuarioReceptor === otroUsuario.id)
                .sort((a, b) => a.fecha.localeCompare(b.fecha)))
        } catch (err) { console.error('Error:', err) }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text mb-6 tracking-tight">Recomendaciones</h1>
            <div className="flex gap-4 h-[calc(100vh-200px)]">
                <div className="w-72 flex-shrink-0 bg-dark-card rounded-xl overflow-y-auto">
                    {conversaciones.length === 0 ? <p className="text-dark-muted p-4 text-sm">No tienes recomendaciones</p> :
                        conversaciones.map((c) => (
                            <button key={c.id} onClick={() => seleccionarUsuario(c)}
                                    className={`w-full text-left p-4 border-b border-dark-border hover:bg-dark-elevated transition-colors ${seleccionado?.id === c.id ? 'bg-dark-elevated' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-terra/20 rounded-full flex items-center justify-center text-terra font-bold">{c.nombre?.charAt(0).toUpperCase()}</div>
                                    <div><p className="text-dark-text font-medium text-sm">{c.nombre}</p><p className="text-dark-muted text-xs">{c.count} recomendaciones</p></div>
                                </div>
                            </button>
                        ))}
                </div>

                <div className="flex-1 bg-dark-card rounded-xl flex flex-col">
                    {!seleccionado ? (
                        <div className="flex-1 flex items-center justify-center"><p className="text-dark-muted">Selecciona una conversación</p></div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-dark-border flex items-center gap-3">
                                <div className="w-10 h-10 bg-terra/20 rounded-full flex items-center justify-center text-terra font-bold">{seleccionado.nombre?.charAt(0).toUpperCase()}</div>
                                <Link to={`/usuario/${seleccionado.id}`} className="text-dark-text font-medium hover:text-terra transition-colors">{seleccionado.nombre}</Link>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {mensajes.map((m) => {
                                    const esMio = m.idusuarioEmisor === usuario.id
                                    return (
                                        <div key={m.idrecomendacion} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs rounded-xl p-3 ${esMio ? 'bg-terra/20 border border-terra/30' : 'bg-dark-elevated border border-dark-border'}`}>
                                                <Link to={`/libro/${m.idlibro}`} className="flex gap-3 items-start hover:opacity-80">
                                                    {m.portadaLibro ? <img src={m.portadaLibro} alt={m.tituloLibro} className="w-12 h-16 object-cover rounded flex-shrink-0" />
                                                        : <div className="w-12 h-16 bg-dark-border rounded flex-shrink-0 flex items-center justify-center text-dark-muted text-xs">📖</div>}
                                                    <div>
                                                        <p className={`font-medium text-sm ${esMio ? 'text-terra' : 'text-dark-text'}`}>{m.tituloLibro}</p>
                                                        <p className="text-dark-muted text-xs">{m.nombreAutorLibro}</p>
                                                    </div>
                                                </Link>
                                                {m.mensaje && <p className={`text-sm mt-2 ${esMio ? 'text-terra/80' : 'text-dark-text/80'}`}>{m.mensaje}</p>}
                                                <p className="text-xs text-dark-muted mt-2 text-right">{new Date(m.fecha).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="p-3 border-t border-dark-border text-center">
                                <p className="text-dark-muted text-xs">Para recomendar un libro, ve a la página del libro y pulsa "Recomendar"</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}