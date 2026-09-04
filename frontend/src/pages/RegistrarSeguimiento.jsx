import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function RegistrarSeguimiento() {
    const { idlibro } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [libro, setLibro] = useState(null)
    const [historial, setHistorial] = useState([])
    const [estado, setEstado] = useState('LEYENDO')
    const [numPagina, setNumPagina] = useState('')
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')

    useEffect(() => { cargarLibro(); cargarHistorial() }, [idlibro])

    const cargarLibro = async () => {
        try { const res = await api.get(`/libros/${idlibro}`); setLibro(res.data) }
        catch (err) { console.error('Error:', err) }
    }
    const cargarHistorial = async () => {
        try { const res = await api.get(`/seguimientos/usuario/${usuario.id}/libro/${idlibro}`); setHistorial(res.data || []) }
        catch (err) { console.error('Error:', err) }
    }

    const ultimoEstado = historial.length > 0 ? historial[historial.length - 1].estado : null

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setExito('')
        const body = { estado, idusuario: usuario.id, idlibro: parseInt(idlibro) }
        if (estado === 'LEYENDO' && numPagina) body.numPagina = parseInt(numPagina)
        try {
            await api.post('/seguimientos', body)
            setExito(estado === 'LEYENDO' ? 'Progreso actualizado' : estado === 'LEIDO' ? '¡Libro terminado!' : 'Libro abandonado')
            setNumPagina(''); cargarHistorial()
        } catch (err) { setError(err.response?.data?.mensaje || 'Error al registrar') }
    }

    if (!libro) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-terra tracking-tight">Seguimiento de lectura</h1>
                <button onClick={() => navigate(`/libro/${idlibro}`)} className="text-dark-muted hover:text-dark-text text-2xl transition-colors">✕</button>
            </div>

            <div className="flex gap-6">
                <div className="flex-shrink-0">
                    {libro.portada ? <img src={libro.portada} alt={libro.titulo} className="w-36 h-52 object-cover rounded-xl" />
                        : <div className="w-36 h-52 bg-dark-elevated rounded-xl flex items-center justify-center text-dark-muted text-sm">Sin portada</div>}
                </div>

                <div className="flex-1">
                    <h2 className="text-xl font-bold text-dark-text">{libro.titulo}</h2>
                    <p className="text-dark-muted text-sm mb-1">{libro.nombreAutor}</p>
                    {libro.numPaginas && <p className="text-dark-muted text-sm">{libro.numPaginas} páginas</p>}

                    {ultimoEstado && (
                        <div className="mt-3 mb-4">
              <span className={`text-sm px-3 py-1 rounded-full ${
                  ultimoEstado === 'LEYENDO' ? 'bg-terra/20 text-terra' :
                      ultimoEstado === 'LEIDO' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-red-500/20 text-red-400'
              }`}>
                {ultimoEstado === 'LEYENDO' ? 'Leyendo' : ultimoEstado === 'LEIDO' ? 'Leído' : 'Abandonado'}
              </span>
                            {ultimoEstado === 'LEYENDO' && historial.length > 0 && (
                                <span className="text-dark-muted text-sm ml-3">
                  Página {historial[historial.length - 1].numPagina}{libro.numPaginas && ` / ${libro.numPaginas}`}
                </span>
                            )}
                        </div>
                    )}

                    {ultimoEstado === 'LEYENDO' && libro.numPaginas && historial.length > 0 && (
                        <div className="mb-4">
                            <div className="bg-dark-border rounded-full h-2.5">
                                <div className="bg-terra h-2.5 rounded-full transition-all"
                                     style={{ width: `${(historial[historial.length - 1].numPagina / libro.numPaginas) * 100}%` }} />
                            </div>
                            <p className="text-xs text-dark-muted mt-1">{Math.round((historial[historial.length - 1].numPagina / libro.numPaginas) * 100)}%</p>
                        </div>
                    )}

                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    {exito && <p className="text-emerald-400 text-sm mb-4">{exito}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-dark-muted text-sm mb-2">Acción</label>
                            <div className="flex gap-2">
                                {(!ultimoEstado || ultimoEstado === 'LEIDO' || ultimoEstado === 'ABANDONADO') && (
                                    <button type="button" onClick={() => setEstado('LEYENDO')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${estado === 'LEYENDO' ? 'bg-terra text-white' : 'bg-dark-elevated text-dark-muted'}`}>
                                        Empezar a leer
                                    </button>
                                )}
                                {ultimoEstado === 'LEYENDO' && (
                                    <>
                                        <button type="button" onClick={() => setEstado('LEYENDO')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${estado === 'LEYENDO' ? 'bg-terra text-white' : 'bg-dark-elevated text-dark-muted'}`}>
                                            Actualizar progreso
                                        </button>
                                        <button type="button" onClick={() => setEstado('LEIDO')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${estado === 'LEIDO' ? 'bg-emerald-500 text-white' : 'bg-dark-elevated text-dark-muted'}`}>
                                            Terminado
                                        </button>
                                        <button type="button" onClick={() => setEstado('ABANDONADO')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${estado === 'ABANDONADO' ? 'bg-red-500 text-white' : 'bg-dark-elevated text-dark-muted'}`}>
                                            Abandonar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {estado === 'LEYENDO' && ultimoEstado === 'LEYENDO' && (
                            <div>
                                <label className="block text-dark-muted text-sm mb-2">Página actual {libro.numPaginas && `(máx. ${libro.numPaginas})`}</label>
                                <input type="number" value={numPagina} onChange={(e) => setNumPagina(e.target.value)}
                                       min={historial.length > 0 ? historial[historial.length - 1].numPagina + 1 : 1}
                                       max={libro.numPaginas || undefined}
                                       className="w-32 bg-dark-elevated border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-terra focus:outline-none transition-colors"
                                       placeholder={historial.length > 0 ? `Desde ${historial[historial.length - 1].numPagina + 1}` : 'Página'} />
                            </div>
                        )}

                        <button type="submit" className="bg-terra hover:bg-terra-hover text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                            {estado === 'LEYENDO' && !ultimoEstado ? 'Empezar a leer' :
                                estado === 'LEYENDO' ? 'Guardar progreso' :
                                    estado === 'LEIDO' ? 'Marcar como leído' : 'Abandonar libro'}
                        </button>
                    </form>
                </div>
            </div>

            {historial.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-dark-text mb-3">Historial</h3>
                    <div className="space-y-2">
                        {[...historial].reverse().map((s) => (
                            <div key={s.idseguimiento} className="bg-dark-card p-3 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                      s.estado === 'LEYENDO' ? 'bg-terra/20 text-terra' :
                          s.estado === 'LEIDO' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-red-500/20 text-red-400'}`}>{s.estado}</span>
                                    <span className="text-dark-text text-sm">Página {s.numPagina}</span>
                                </div>
                                <span className="text-dark-muted text-xs">{s.fecha}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}