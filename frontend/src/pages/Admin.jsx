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
    const [enriqueciendo, setEnriqueciendo] = useState(false)
    const [resultadoAutores, setResultadoAutores] = useState('')
    const [errorAutores, setErrorAutores] = useState('')

    if (!usuario || usuario.rol !== 'ADMIN') return <p className="text-error">No tienes permisos de administrador</p>

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

    // Reintenta con Open Library los autores que se quedaron sin foto al importarse
    const handleEnriquecerAutores = async () => {
        setErrorAutores(''); setResultadoAutores('')
        setEnriqueciendo(true)
        try {
            const res = await api.post('/carga/autores/enriquecer')
            const n = res.data?.autoresEnriquecidos ?? 0
            setResultadoAutores(n === 1 ? 'Se ha completado 1 autor.' : `Se han completado ${n} autores.`)
        } catch (err) { setErrorAutores(err.response?.data?.mensaje || 'Error al completar los autores') }
        finally { setEnriqueciendo(false) }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-4xl leading-none text-texto mb-6">Panel de administración</h1>
            <div className="border border-linea rounded p-6">
                <h2 className="text-lg font-semibold text-acento mb-4">Carga masiva de libros</h2>
                <p className="text-texto-sec text-sm mb-4">Importa libros desde Google Books por género e idioma.</p>
                {error && <p className="text-error text-sm mb-4">{error}</p>}
                {resultado && <p className="text-exito text-sm mb-4">{resultado}</p>}
                <form onSubmit={handleCargaMasiva} className="space-y-4">
                    <div>
                        <label className="etiqueta block mb-2">Géneros ({generosSeleccionados.length} seleccionados)</label>
                        <div className="flex flex-wrap gap-2">
                            {GENEROS.map((g) => (
                                <button key={g} type="button" onClick={() => toggleGenero(g)}
                                        aria-pressed={generosSeleccionados.includes(g)}
                                        className={`text-xs px-2.5 py-1 rounded ${generosSeleccionados.includes(g) ? 'bg-texto text-fondo' : 'border border-linea text-texto-sec hover:text-texto'}`}>{g}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div>
                            <label className="etiqueta block mb-2">Cantidad por género</label>
                            <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} min="1" max="40"
                                   className="campo w-32" />
                        </div>
                        <div>
                            <label className="etiqueta block mb-2">Idioma</label>
                            <select value={idioma} onChange={(e) => setIdioma(e.target.value)}
                                    className="campo w-auto">
                                <option value="es">Español</option><option value="en">Inglés</option><option value="fr">Francés</option>
                                <option value="de">Alemán</option><option value="it">Italiano</option><option value="pt">Portugués</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" disabled={cargando}
                            className="btn-acento">
                        {cargando ? 'Cargando…' : 'Iniciar carga masiva'}</button>
                </form>
            </div>
            <div className="border border-linea rounded p-6 mt-6">
                <h2 className="text-lg font-semibold text-acento mb-4">Completar autores</h2>
                <p className="text-texto-sec text-sm mb-4">
                    Busca en Open Library la foto y la biografía de los autores que no tienen foto. Puede tardar un poco si son muchos.
                </p>
                {errorAutores && <p className="text-error text-sm mb-4">{errorAutores}</p>}
                {resultadoAutores && <p className="text-exito text-sm mb-4">{resultadoAutores}</p>}
                <button type="button" onClick={handleEnriquecerAutores} disabled={enriqueciendo} className="btn-acento">
                    {enriqueciendo ? 'Completando…' : 'Completar autores sin foto'}</button>
            </div>
        </div>
    )
}