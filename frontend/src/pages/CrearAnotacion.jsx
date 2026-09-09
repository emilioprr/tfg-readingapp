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

    useEffect(() => { cargarLibro(); cargarAnotaciones() }, [idlibro])

    const cargarLibro = async () => {
        try { const res = await api.get(`/libros/${idlibro}`); setLibro(res.data) }
        catch (err) { console.error('Error:', err) }
    }
    const cargarAnotaciones = async () => {
        try { const res = await api.get(`/anotaciones/usuario/${usuario.id}/libro/${idlibro}`); setAnotaciones(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setExito('')
        if (!texto.trim()) { setError('El texto es obligatorio'); return }
        try {
            await api.post('/anotaciones', { texto, parte, tipo, esPublica, tieneSpoiler, idlibro: parseInt(idlibro), idusuario: usuario.id })
            setExito('Anotación guardada'); setTexto(''); setParte(''); cargarAnotaciones()
        } catch (err) { setError(err.response?.data?.mensaje || 'Error al crear anotación') }
        navigate('/')
    }

    const eliminarAnotacion = async (id) => {
        try { await api.delete(`/anotaciones/${id}`); cargarAnotaciones() }
        catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    if (!libro) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-terra tracking-tight">Anotaciones</h1>
                <button onClick={() => navigate(`/`)} className="text-dark-muted hover:text-dark-text text-2xl transition-colors">✕</button>
            </div>
            <p className="text-dark-muted text-sm mb-6">
                Apunta reflexiones, citas o ideas sobre lo que estás leyendo. Puedes indicar el capítulo o la página para encontrarlas fácilmente después.
            </p>

            <div className="flex gap-6 mb-8">
                {libro.portada ? <img src={libro.portada} alt={libro.titulo} className="w-24 h-36 object-cover rounded-xl flex-shrink-0" />
                    : <div className="w-24 h-36 bg-dark-elevated rounded-xl flex-shrink-0 flex items-center justify-center text-dark-muted text-sm">Sin portada</div>}
                <div>
                    <h2 className="text-xl font-bold text-dark-text">{libro.titulo}</h2>
                    <p className="text-dark-muted text-sm">{libro.nombreAutor}</p>
                </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            {exito && <p className="text-emerald-400 text-sm mb-4">{exito}</p>}

            <form onSubmit={handleSubmit} className="bg-dark-card p-5 rounded-xl mb-8 space-y-4">
                <div className="flex gap-3">
                    <button type="button" onClick={() => setTipo('NOTA')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tipo === 'NOTA' ? 'bg-terra text-white' : 'bg-dark-elevated text-dark-muted'}`}>📝 Nota</button>
                    <button type="button" onClick={() => setTipo('CITA')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tipo === 'CITA' ? 'bg-terra text-white' : 'bg-dark-elevated text-dark-muted'}`}>💬 Cita</button>
                </div>
                <div>
                    <label className="block text-dark-muted text-sm mb-1">Parte del libro (opcional)</label>
                    <input type="text" value={parte} onChange={(e) => setParte(e.target.value)}
                           className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" placeholder="Ej: Capítulo 3, página 42" />
                </div>
                <div>
                    <label className="block text-dark-muted text-sm mb-1">{tipo === 'NOTA' ? 'Tu nota' : 'La cita'}</label>
                    <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3}
                              className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors"
                              placeholder={tipo === 'NOTA' ? 'Escribe tu nota...' : 'Escribe la cita...'} required />
                </div>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-dark-muted text-sm cursor-pointer"><input type="checkbox" checked={esPublica} onChange={(e) => setEsPublica(e.target.checked)} className="accent-terra" />Pública</label>
                    <label className="flex items-center gap-2 text-dark-muted text-sm cursor-pointer"><input type="checkbox" checked={tieneSpoiler} onChange={(e) => setTieneSpoiler(e.target.checked)} className="accent-terra" />Spoiler</label>
                </div>
                <button type="submit" className="bg-terra hover:bg-terra-hover text-white font-semibold px-6 py-2 rounded-lg transition-colors">Guardar anotación</button>
            </form>

            <h3 className="text-lg font-semibold text-dark-text mb-4">Mis anotaciones</h3>
            {anotaciones.length === 0 ? <p className="text-dark-muted">No tienes anotaciones en este libro</p> : (
                <div className="space-y-3">
                    {anotaciones.map((a) => (
                        <div key={a.idanotacion} className="bg-dark-card p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${a.tipo === 'CITA' ? 'bg-terra/10 text-terra' : 'bg-dark-elevated text-dark-muted'}`}>
                    {a.tipo === 'CITA' ? '💬 Cita' : '📝 Nota'}</span>
                                    {a.parte && <span className="text-xs text-dark-muted">{a.parte}</span>}
                                    {a.tieneSpoiler && <span className="text-xs text-red-400">Spoiler</span>}
                                </div>
                                <button onClick={() => eliminarAnotacion(a.idanotacion)} className="text-dark-muted hover:text-red-400 text-sm transition-colors">✕</button>
                            </div>
                            <p className={`${a.tipo === 'CITA' ? 'italic text-terra/80' : 'text-dark-text/80'}`}>
                                {a.tipo === 'CITA' ? `"${a.texto}"` : a.texto}</p>
                            <p className="text-xs text-dark-muted mt-2">{new Date(a.fecha).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}