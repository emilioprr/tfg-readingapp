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

    useEffect(() => {
        cargarLibro()
        cargarHistorial()
    }, [idlibro])

    const cargarLibro = async () => {
        try {
            const res = await api.get(`/libros/${idlibro}`)
            setLibro(res.data)
        } catch (err) {
            console.error('Error cargando libro:', err)
        }
    }

    const cargarHistorial = async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/libro/${idlibro}`)
            setHistorial(res.data || [])
        } catch (err) {
            console.error('Error cargando historial:', err)
        }
    }

    const ultimoEstado = historial.length > 0 ? historial[historial.length - 1].estado : null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setExito('')

        const body = {
            estado,
            idusuario: usuario.id,
            idlibro: parseInt(idlibro),
        }

        if (estado === 'LEYENDO' && numPagina) {
            body.numPagina = parseInt(numPagina)
        }

        try {
            await api.post('/seguimientos', body)
            setExito(
                estado === 'LEYENDO' ? 'Progreso actualizado' :
                    estado === 'LEIDO' ? '¡Libro terminado!' :
                        'Libro abandonado'
            )
            setNumPagina('')
            cargarHistorial()
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al registrar')
        }
    }

    if (!libro) return <p className="text-gray-400">Cargando...</p>

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-amber-400">Seguimiento de lectura</h1>
                <button onClick={() => navigate(`/libro/${idlibro}`)}
                        className="text-gray-400 hover:text-gray-200 text-2xl">
                    ✕
                </button>
            </div>

            <div className="flex gap-6">
                {/* Portada */}
                <div className="flex-shrink-0">
                    {libro.portada ? (
                        <img src={libro.portada} alt={libro.titulo} className="w-36 h-52 object-cover rounded-lg" />
                    ) : (
                        <div className="w-36 h-52 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                            Sin portada
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-100">{libro.titulo}</h2>
                    <p className="text-gray-400 text-sm mb-1">{libro.nombreAutor}</p>
                    {libro.numPaginas && (
                        <p className="text-gray-500 text-sm">{libro.numPaginas} páginas</p>
                    )}

                    {/* Estado actual */}
                    {ultimoEstado && (
                        <div className="mt-3 mb-4">
              <span className={`text-sm px-3 py-1 rounded-full ${
                  ultimoEstado === 'LEYENDO' ? 'bg-amber-500/20 text-amber-400' :
                      ultimoEstado === 'LEIDO' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
              }`}>
                {ultimoEstado === 'LEYENDO' ? 'Leyendo' :
                    ultimoEstado === 'LEIDO' ? 'Leído' : 'Abandonado'}
              </span>
                            {ultimoEstado === 'LEYENDO' && historial.length > 0 && (
                                <span className="text-gray-400 text-sm ml-3">
                  Página {historial[historial.length - 1].numPagina}
                                    {libro.numPaginas && ` / ${libro.numPaginas}`}
                </span>
                            )}
                        </div>
                    )}

                    {/* Barra de progreso */}
                    {ultimoEstado === 'LEYENDO' && libro.numPaginas && historial.length > 0 && (
                        <div className="mb-4">
                            <div className="bg-gray-800 rounded-full h-3">
                                <div className="bg-amber-500 h-3 rounded-full transition-all"
                                     style={{ width: `${(historial[historial.length - 1].numPagina / libro.numPaginas) * 100}%` }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {Math.round((historial[historial.length - 1].numPagina / libro.numPaginas) * 100)}%
                            </p>
                        </div>
                    )}

                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    {exito && <p className="text-green-400 text-sm mb-4">{exito}</p>}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Acción</label>
                            <div className="flex gap-2">
                                {(!ultimoEstado || ultimoEstado === 'LEIDO' || ultimoEstado === 'ABANDONADO') && (
                                    <button type="button" onClick={() => setEstado('LEYENDO')}
                                            className={`px-4 py-2 rounded text-sm font-medium ${
                                                estado === 'LEYENDO' ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-400'
                                            }`}>
                                        Empezar a leer
                                    </button>
                                )}
                                {ultimoEstado === 'LEYENDO' && (
                                    <>
                                        <button type="button" onClick={() => setEstado('LEYENDO')}
                                                className={`px-4 py-2 rounded text-sm font-medium ${
                                                    estado === 'LEYENDO' ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-400'
                                                }`}>
                                            Actualizar progreso
                                        </button>
                                        <button type="button" onClick={() => setEstado('LEIDO')}
                                                className={`px-4 py-2 rounded text-sm font-medium ${
                                                    estado === 'LEIDO' ? 'bg-green-500 text-gray-900' : 'bg-gray-800 text-gray-400'
                                                }`}>
                                            Terminado
                                        </button>
                                        <button type="button" onClick={() => setEstado('ABANDONADO')}
                                                className={`px-4 py-2 rounded text-sm font-medium ${
                                                    estado === 'ABANDONADO' ? 'bg-red-500 text-gray-900' : 'bg-gray-800 text-gray-400'
                                                }`}>
                                            Abandonar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {estado === 'LEYENDO' && ultimoEstado === 'LEYENDO' && (
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">
                                    Página actual {libro.numPaginas && `(máx. ${libro.numPaginas})`}
                                </label>
                                <input
                                    type="number"
                                    value={numPagina}
                                    onChange={(e) => setNumPagina(e.target.value)}
                                    min={historial.length > 0 ? historial[historial.length - 1].numPagina + 1 : 1}
                                    max={libro.numPaginas || undefined}
                                    className="w-32 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                                    placeholder={historial.length > 0 ? `Desde ${historial[historial.length - 1].numPagina + 1}` : 'Página'}
                                />
                            </div>
                        )}

                        <button type="submit"
                                className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-6 py-2 rounded">
                            {estado === 'LEYENDO' && !ultimoEstado ? 'Empezar a leer' :
                                estado === 'LEYENDO' ? 'Guardar progreso' :
                                    estado === 'LEIDO' ? 'Marcar como leído' : 'Abandonar libro'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Historial */}
            {historial.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-amber-400 mb-3">Historial</h3>
                    <div className="space-y-2">
                        {[...historial].reverse().map((s) => (
                            <div key={s.idseguimiento} className="bg-gray-900 p-3 rounded-lg border border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                      s.estado === 'LEYENDO' ? 'bg-amber-500/20 text-amber-400' :
                          s.estado === 'LEIDO' ? 'bg-green-500/20 text-green-400' :
                              'bg-red-500/20 text-red-400'
                  }`}>
                    {s.estado}
                  </span>
                                    <span className="text-gray-300 text-sm">Página {s.numPagina}</span>
                                </div>
                                <span className="text-gray-500 text-xs">{s.fecha}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}