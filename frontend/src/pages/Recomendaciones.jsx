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

    useEffect(() => {
        cargarConversaciones()
    }, [])

    const cargarConversaciones = async () => {
        try {
            const [recRes, envRes] = await Promise.all([
                api.get(`/recomendaciones/recibidas/${usuario.id}`),
                api.get(`/recomendaciones/enviadas/${usuario.id}`),
            ])
            const recibidas = recRes.data.content || recRes.data || []
            const enviadas = envRes.data.content || envRes.data || []
            const todas = [...recibidas, ...enviadas]

            // Agrupar por el otro usuario
            const mapa = {}
            todas.forEach((r) => {
                const otroId = r.idusuarioEmisor == usuario.id ? r.idusuarioReceptor : r.idusuarioEmisor
                const otroNombre = r.idusuarioEmisor == usuario.id ? r.nombreReceptor : r.nombreEmisor
                if (!mapa[otroId]) {
                    mapa[otroId] = { id: otroId, nombre: otroNombre, ultima: r.fecha, count: 0 }
                }
                mapa[otroId].count++
                if (r.fecha > mapa[otroId].ultima) mapa[otroId].ultima = r.fecha
            })

            const lista = Object.values(mapa).sort((a, b) => b.ultima.localeCompare(a.ultima))
            setConversaciones(lista)
        } catch (err) {
            console.error('Error cargando conversaciones:', err)
        } finally {
            setLoading(false)
        }
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
            const todas = [...recibidas, ...enviadas]
                .filter(r => r.idusuarioEmisor == otroUsuario.id || r.idusuarioReceptor == otroUsuario.id)
                .sort((a, b) => a.fecha.localeCompare(b.fecha))
            setMensajes(todas)
        } catch (err) {
            console.error('Error cargando mensajes:', err)
        }
    }

    if (loading) return <p className="text-gray-400">Cargando...</p>

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-amber-400 mb-6">Recomendaciones</h1>

            <div className="flex gap-4 h-[calc(100vh-200px)]">
                {/* Lista de conversaciones */}
                <div className="w-72 flex-shrink-0 bg-gray-900 rounded-lg border border-gray-800 overflow-y-auto">
                    {conversaciones.length === 0 ? (
                        <p className="text-gray-500 p-4 text-sm">No tienes recomendaciones</p>
                    ) : (
                        conversaciones.map((c) => (
                            <button key={c.id} onClick={() => seleccionarUsuario(c)}
                                    className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800 ${
                                        seleccionado?.id === c.id ? 'bg-gray-800' : ''
                                    }`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold">
                                        {c.nombre?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-gray-200 font-medium text-sm">{c.nombre}</p>
                                        <p className="text-gray-500 text-xs">{c.count} recomendaciones</p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Chat */}
                <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 flex flex-col">
                    {!seleccionado ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-gray-500">Selecciona una conversación</p>
                        </div>
                    ) : (
                        <>
                            {/* Cabecera */}
                            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold">
                                    {seleccionado.nombre?.charAt(0).toUpperCase()}
                                </div>
                                <Link to={`/usuario/${seleccionado.id}`} className="text-gray-200 font-medium hover:text-amber-400">
                                    {seleccionado.nombre}
                                </Link>
                            </div>

                            {/* Mensajes */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {mensajes.map((m) => {
                                    const esMio = m.idusuarioEmisor === usuario.id
                                    return (
                                        <div key={m.idrecomendacion} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs rounded-lg p-3 ${
                                                esMio
                                                    ? 'bg-amber-500/20 border border-amber-500/30'
                                                    : 'bg-gray-800 border border-gray-700'
                                            }`}>
                                                <Link to={`/libro/${m.idlibro}`}
                                                      className="flex gap-3 items-start hover:opacity-80">
                                                    {m.portadaLibro ? (
                                                        <img src={m.portadaLibro} alt={m.tituloLibro}
                                                             className="w-12 h-16 object-cover rounded flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-12 h-16 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center text-gray-500 text-xs">
                                                            📖
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className={`font-medium text-sm ${esMio ? 'text-amber-400' : 'text-gray-200'}`}>
                                                            {m.tituloLibro}
                                                        </p>
                                                        <p className="text-gray-500 text-xs">{m.nombreAutorLibro}</p>
                                                    </div>
                                                </Link>
                                                {m.mensaje && (
                                                    <p className={`text-sm mt-2 ${esMio ? 'text-amber-200' : 'text-gray-300'}`}>
                                                        {m.mensaje}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-2 text-right">
                                                    {new Date(m.fecha).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Nota inferior */}
                            <div className="p-3 border-t border-gray-800 text-center">
                                <p className="text-gray-500 text-xs">
                                    Para recomendar un libro, ve a la página del libro y pulsa "Recomendar"
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}