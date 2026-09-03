import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const ETIQUETAS = [
    'MELANCOLICO', 'TRISTE', 'ALEGRE', 'OSCURO', 'ESPERANZADOR',
    'TENSO', 'ROMANTICO', 'DIVERTIDO', 'REFLEXIVO', 'INQUIETANTE',
    'INSPIRADOR', 'NOSTALGICO', 'MISTERIOSO', 'EPICO', 'INTIMO',
    'PERTURBADOR', 'RECONFORTANTE', 'AVENTURERO', 'POETICO', 'PROVOCADOR'
]

export default function CrearResena() {
    const { idlibro } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()

    const [libro, setLibro] = useState(null)
    const [texto, setTexto] = useState('')
    const [puntuacion, setPuntuacion] = useState(0)
    const [hoverPuntuacion, setHoverPuntuacion] = useState(0)
    const [bloqueadoEstrellas, setBloqueadoEstrellas] = useState(false)
    const [ritmo, setRitmo] = useState(0)
    const [hoverRitmo, setHoverRitmo] = useState(0)
    const [bloqueadoRitmo, setBloqueadoRitmo] = useState(false)
    const [etiquetas, setEtiquetas] = useState([])
    const [esPublica, setEsPublica] = useState(true)
    const [tieneSpoiler, setTieneSpoiler] = useState(false)
    const [leidoPreviamente, setLeidoPreviamente] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        cargarLibro()
    }, [idlibro])

    const cargarLibro = async () => {
        try {
            const res = await api.get(`/libros/${idlibro}`)
            setLibro(res.data)
        } catch (err) {
            console.error('Error cargando libro:', err)
        }
    }

    const toggleEtiqueta = (et) => {
        setEtiquetas(prev =>
            prev.includes(et) ? prev.filter(e => e !== et) : [...prev, et]
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (puntuacion === 0) {
            setError('La puntuación es obligatoria')
            return
        }
        if (ritmo === 0) {
            setError('El ritmo es obligatorio')
            return
        }

        try {
            await api.post('/resenas', {
                texto,
                puntuacion,
                ritmo,
                etiquetas,
                esPublica,
                tieneSpoiler,
                leidopreviamente: leidoPreviamente,
                idlibro: parseInt(idlibro),
                idusuario: usuario.id,
            })
            navigate(`/libro/${idlibro}`)
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al crear la reseña')
        }
    }

    // --- Estrellas ---
    const handleClickEstrella = (estrella, esMitadIzquierda) => {
        const valor = esMitadIzquierda ? estrella - 0.5 : estrella
        if (bloqueadoEstrellas && valor === puntuacion) {
            setBloqueadoEstrellas(false)
        } else {
            setPuntuacion(valor)
            setBloqueadoEstrellas(true)
        }
    }

    const handleHoverEstrella = (estrella, esMitadIzquierda) => {
        if (!bloqueadoEstrellas) {
            const valor = esMitadIzquierda ? estrella - 0.5 : estrella
            setHoverPuntuacion(valor)
        }
    }

    const renderEstrellas = () => {
        const activa = bloqueadoEstrellas ? puntuacion : (hoverPuntuacion || puntuacion)
        return [1, 2, 3, 4, 5].map((estrella) => {
            let fill = 'empty'
            if (activa >= estrella) fill = 'full'
            else if (activa >= estrella - 0.5) fill = 'half'

            return (
                <span key={estrella} className="relative cursor-pointer text-3xl select-none"
                      onMouseLeave={() => { if (!bloqueadoEstrellas) setHoverPuntuacion(0) }}>
          <span className="absolute inset-0 w-1/2 overflow-hidden z-10"
                onClick={() => handleClickEstrella(estrella, true)}
                onMouseEnter={() => handleHoverEstrella(estrella, true)} />
          <span className="absolute inset-0 left-1/2 w-1/2 z-10"
                onClick={() => handleClickEstrella(estrella, false)}
                onMouseEnter={() => handleHoverEstrella(estrella, false)} />
                    {fill === 'full' && <span className="text-amber-400">★</span>}
                    {fill === 'half' && (
                        <span className="relative">
              <span className="text-gray-600">★</span>
              <span className="absolute inset-0 overflow-hidden w-1/2 text-amber-400">★</span>
            </span>
                    )}
                    {fill === 'empty' && <span className="text-gray-600">★</span>}
        </span>
            )
        })
    }

    // --- Rayos ---
    const handleClickRayo = (valor) => {
        if (bloqueadoRitmo && valor === ritmo) {
            setBloqueadoRitmo(false)
        } else {
            setRitmo(valor)
            setBloqueadoRitmo(true)
        }
    }

    const handleHoverRayo = (valor) => {
        if (!bloqueadoRitmo) {
            setHoverRitmo(valor)
        }
    }

    const renderRayos = () => {
        const activo = bloqueadoRitmo ? ritmo : (hoverRitmo || ritmo)
        return [1, 2, 3].map((r) => (
            <span key={r}
                  onClick={() => handleClickRayo(r)}
                  onMouseEnter={() => handleHoverRayo(r)}
                  onMouseLeave={() => { if (!bloqueadoRitmo) setHoverRitmo(0) }}
                  className={`cursor-pointer text-2xl select-none px-2 py-1 rounded transition-opacity ${
                      activo >= r ? 'opacity-100' : 'opacity-25'
                  }`}>
      ⚡
    </span>
        ))
    }

    const ritmoLabels = ['', 'Lento', 'Medio', 'Rápido']

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-amber-400">Escribir reseña</h1>
                <button onClick={() => navigate(-1)}
                        className="text-gray-400 hover:text-gray-200 text-2xl">
                    ✕
                </button>
            </div>

            <div className="flex gap-6">
                {/* Portada del libro */}
                {libro && (
                    <div className="flex-shrink-0">
                        {libro.portada ? (
                            <img src={libro.portada} alt={libro.titulo} className="w-36 h-52 object-cover rounded-lg" />
                        ) : (
                            <div className="w-36 h-52 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                                Sin portada
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1">
                    {/* Título del libro */}
                    {libro && (
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-gray-100">{libro.titulo}</h2>
                            <p className="text-gray-400 text-sm">{libro.nombreAutor}</p>
                        </div>
                    )}

                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Puntuación */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Puntuación</label>
                            <div className="flex items-center gap-1">
                                {renderEstrellas()}
                                {puntuacion > 0 && (
                                    <span className="ml-3 text-amber-400 font-bold text-lg">{puntuacion}</span>
                                )}
                            </div>
                        </div>

                        {/* Ritmo */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Ritmo</label>
                            <div className="flex items-center gap-1">
                                {renderRayos()}
                                {ritmo > 0 && (
                                    <span className="ml-3 text-amber-400 font-bold text-sm">{ritmoLabels[ritmo]}</span>
                                )}
                            </div>
                        </div>

                        {/* Etiquetas */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Etiquetas</label>
                            <div className="flex flex-wrap gap-2">
                                {ETIQUETAS.map((et) => (
                                    <button key={et} type="button" onClick={() => toggleEtiqueta(et)}
                                            className={`text-xs px-3 py-1 rounded-full ${
                                                etiquetas.includes(et)
                                                    ? 'bg-amber-500 text-gray-900 font-bold'
                                                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                                            }`}>
                                        {et}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Texto */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Tu reseña</label>
                            <textarea
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                rows={5}
                                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                                placeholder="¿Qué te ha parecido el libro?"
                            />
                        </div>

                        {/* Opciones */}
                        <div className="flex flex-wrap gap-6">
                            <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
                                <input type="checkbox" checked={esPublica} onChange={(e) => setEsPublica(e.target.checked)}
                                       className="accent-amber-500" />
                                Pública
                            </label>
                            <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
                                <input type="checkbox" checked={tieneSpoiler} onChange={(e) => setTieneSpoiler(e.target.checked)}
                                       className="accent-amber-500" />
                                Contiene spoilers
                            </label>
                            <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
                                <input type="checkbox" checked={leidoPreviamente} onChange={(e) => setLeidoPreviamente(e.target.checked)}
                                       className="accent-amber-500" />
                                Relectura
                            </label>
                        </div>

                        <button type="submit"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 rounded">
                            Publicar reseña
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}