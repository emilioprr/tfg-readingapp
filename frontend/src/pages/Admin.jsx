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

    if (!usuario || usuario.rol !== 'ADMIN') return <p className="text-red-400">No tienes permisos de administrador</p>

    const toggleGenero = (g) => { setGenerosSeleccionados(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]) }

    const handleCargaMasiva = async (e) => {
        e.preventDefault(); setError(''); setResultado('')
        if (generosSeleccionados.length === 0) { setError('Selecciona al menos un género'); return }
        setCargando(true)
        try {
            const res = await api.post(`/carga/masiva?cantidad=${cantidad}&idioma=${idioma}`, generosSeleccionados)
            setResultado(`Carga completada: ${res.data?.mensaje || 'libros importados'}`)
        } catch (err) { setError(err.response?.data?.mensaje || 'Error en la carga') }
        finally { setCargando(false) }
    }

    const handleCargarPopulares = async () => {
        setError('')
        setResultado('')
        setCargando(true)
        try {
            const res = await api.post('/carga/populares?cantidad=200&idioma=es')
            setResultado(`Importados ${res.data.importados} libros populares`)
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error en la carga')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text mb-6 tracking-tight">Panel de administración</h1>
            <div className="bg-dark-card p-6 rounded-2xl border border-dark-border">
                <h2 className="text-lg font-semibold text-terra mb-4">Carga masiva de libros</h2>
                <p className="text-dark-muted text-sm mb-4">Importa libros desde Google Books por género e idioma.</p>
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                {resultado && <p className="text-emerald-400 text-sm mb-4">{resultado}</p>}
                <form onSubmit={handleCargaMasiva} className="space-y-4">
                    <div>
                        <label className="block text-dark-muted text-sm mb-2">Géneros ({generosSeleccionados.length} seleccionados)</label>
                        <div className="flex flex-wrap gap-2">
                            {GENEROS.map((g) => (
                                <button key={g} type="button" onClick={() => toggleGenero(g)}
                                        className={`text-xs px-3 py-1 rounded-full transition-colors ${generosSeleccionados.includes(g) ? 'bg-terra text-white font-bold' : 'bg-dark-elevated text-dark-muted hover:text-dark-text'}`}>{g}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div>
                            <label className="block text-dark-muted text-sm mb-1">Cantidad por género</label>
                            <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} min="1" max="40"
                                   className="w-32 bg-dark-elevated border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-terra focus:outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="block text-dark-muted text-sm mb-1">Idioma</label>
                            <select value={idioma} onChange={(e) => setIdioma(e.target.value)}
                                    className="bg-dark-elevated border border-dark-border rounded-lg px-3 py-2 text-dark-text focus:border-terra focus:outline-none transition-colors">
                                <option value="es">Español</option><option value="en">Inglés</option><option value="fr">Francés</option>
                                <option value="de">Alemán</option><option value="it">Italiano</option><option value="pt">Portugués</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" disabled={cargando}
                            className="bg-terra hover:bg-terra-hover text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                        {cargando ? 'Cargando...' : 'Iniciar carga masiva'}</button>
                    <div className="border-t border-dark-border pt-4 mt-4">
                        <h3 className="text-sm font-medium text-dark-muted mb-3">Carga rápida de populares</h3>
                        <p className="text-dark-muted text-xs mb-3">Importa los libros más relevantes de Google Books en español.</p>
                        <button onClick={handleCargarPopulares} disabled={cargando}
                                className="bg-terra hover:bg-terra-hover text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                            {cargando ? 'Cargando...' : 'Importar 200 populares'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}