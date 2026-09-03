import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const GENEROS = [
    'fiction', 'fantasy', 'romance', 'science', 'history',
    'mystery', 'thriller', 'horror', 'biography', 'poetry',
    'philosophy', 'psychology', 'adventure', 'drama', 'comedy',
    'children', 'young-adult', 'self-help', 'cooking', 'travel',
    'art', 'music', 'sports', 'politics', 'economics',
    'technology', 'nature', 'religion', 'education', 'comics'
]

export default function Admin() {
    const { usuario } = useAuth()
    const [cantidad, setCantidad] = useState(20)
    const [idioma, setIdioma] = useState('es')
    const [generosSeleccionados, setGenerosSeleccionados] = useState([])
    const [cargando, setCargando] = useState(false)
    const [resultado, setResultado] = useState('')
    const [error, setError] = useState('')

    if (!usuario || usuario.rol !== 'ADMIN') {
        return <p className="text-red-400">No tienes permisos de administrador</p>
    }

    const toggleGenero = (genero) => {
        setGenerosSeleccionados(prev =>
            prev.includes(genero) ? prev.filter(g => g !== genero) : [...prev, genero]
        )
    }

    const handleCargaMasiva = async (e) => {
        e.preventDefault()
        setError('')
        setResultado('')

        if (generosSeleccionados.length === 0) {
            setError('Selecciona al menos un género')
            return
        }

        setCargando(true)

        try {
            const res = await api.post(`/carga/masiva?cantidad=${cantidad}&idioma=${idioma}`, generosSeleccionados)
            setResultado(`Carga completada: ${res.data?.mensaje || 'libros importados correctamente'}`)
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error en la carga masiva')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-amber-400 mb-6">Panel de administración</h1>

            <div className="bg-gray-900 p-6 rounded-lg border border-amber-500/20">
                <h2 className="text-lg font-bold text-amber-400 mb-4">Carga masiva de libros</h2>
                <p className="text-gray-400 text-sm mb-4">
                    Importa libros desde Google Books por género e idioma.
                </p>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                {resultado && <p className="text-green-400 text-sm mb-4">{resultado}</p>}

                <form onSubmit={handleCargaMasiva} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">
                            Géneros ({generosSeleccionados.length} seleccionados)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {GENEROS.map((g) => (
                                <button key={g} type="button" onClick={() => toggleGenero(g)}
                                        className={`text-xs px-3 py-1 rounded-full ${
                                            generosSeleccionados.includes(g)
                                                ? 'bg-amber-500 text-gray-900 font-bold'
                                                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                                        }`}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Cantidad por género</label>
                            <input
                                type="number"
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                min="1"
                                max="40"
                                className="w-32 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Idioma</label>
                            <select value={idioma} onChange={(e) => setIdioma(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none">
                                <option value="es">Español</option>
                                <option value="en">Inglés</option>
                                <option value="fr">Francés</option>
                                <option value="de">Alemán</option>
                                <option value="it">Italiano</option>
                                <option value="pt">Portugués</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" disabled={cargando}
                            className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-6 py-2 rounded disabled:opacity-50">
                        {cargando ? 'Cargando...' : 'Iniciar carga masiva'}
                    </button>
                </form>
            </div>
        </div>
    )
}