import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'

/** Buscador para añadir libros a una lista sin salir de ella. */
export default function AnadirLibrosModal({ idlista, idsEnLista, onCambio, onClose }) {
    const [query, setQuery] = useState('')
    const [resultados, setResultados] = useState([])
    const [buscando, setBuscando] = useState(false)
    const [enLista, setEnLista] = useState(() => new Set(idsEnLista))
    const [error, setError] = useState('')
    const ultimaBusqueda = useRef(0)

    // Búsqueda mientras escribes, esperando a que pares un momento
    useEffect(() => {
        const texto = query.trim()
        if (texto.length < 2) { setResultados([]); return }
        const numero = ++ultimaBusqueda.current
        const t = setTimeout(async () => {
            setBuscando(true)
            try {
                const res = await api.get(`/libros/buscar?titulo=${encodeURIComponent(texto)}&page=0&size=12`)
                if (numero === ultimaBusqueda.current) setResultados(res.data.content || res.data || [])
            } catch (err) { console.error('Error:', err) }
            finally { if (numero === ultimaBusqueda.current) setBuscando(false) }
        }, 300)
        return () => clearTimeout(t)
    }, [query])

    useEffect(() => {
        const alPulsar = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', alPulsar)
        return () => window.removeEventListener('keydown', alPulsar)
    }, [onClose])

    const alternar = async (libro) => {
        setError('')
        const estaba = enLista.has(libro.idlibro)
        try {
            if (estaba) await api.delete(`/listas/${idlista}/libros/${libro.idlibro}`)
            else await api.post(`/listas/${idlista}/libros/${libro.idlibro}`)
            setEnLista(prev => {
                const s = new Set(prev)
                if (estaba) s.delete(libro.idlibro); else s.add(libro.idlibro)
                return s
            })
            onCambio()
        } catch (err) { setError(err.response?.data?.mensaje || 'No se ha podido guardar el cambio') }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 px-4 pt-16 sm:pt-0" onClick={onClose}>
            <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="text-dark-text font-semibold">Añadir libros</h2>
                    <button onClick={onClose} className="text-dark-muted hover:text-dark-text transition-colors" aria-label="Cerrar">✕</button>
                </div>
                <div className="px-5">
                    <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busca por título..."
                           className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-sm text-dark-text focus:border-terra focus:outline-none" />
                </div>
                {error && <p className="text-red-400 text-xs px-5 pt-2">{error}</p>}

                <div className="max-h-96 overflow-y-auto p-2 mt-2">
                    {query.trim().length < 2 ? (
                        <p className="text-dark-muted text-sm px-3 py-6 text-center">Escribe al menos dos letras del título</p>
                    ) : buscando && resultados.length === 0 ? (
                        <p className="text-dark-muted text-sm px-3 py-6 text-center">Buscando...</p>
                    ) : resultados.length === 0 ? (
                        <p className="text-dark-muted text-sm px-3 py-6 text-center">No hay libros con ese título en el catálogo</p>
                    ) : (
                        resultados.map((libro) => {
                            const esta = enLista.has(libro.idlibro)
                            return (
                                <div key={libro.idlibro} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-elevated transition-colors">
                                    {libro.portada ? (
                                        <img src={libro.portada} alt={libro.titulo} className="w-9 h-14 object-cover rounded-sm flex-shrink-0" />
                                    ) : (
                                        <div className="w-9 h-14 bg-dark-elevated rounded-sm flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-dark-text text-sm truncate">{libro.titulo}</p>
                                        <p className="text-dark-muted text-xs truncate">{libro.nombreAutor}</p>
                                    </div>
                                    <button onClick={() => alternar(libro)}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${esta
                                                ? 'text-terra border border-terra/40 hover:border-red-400 hover:text-red-400'
                                                : 'bg-terra hover:bg-terra-hover text-white'}`}
                                            title={esta ? 'Quitar de la lista' : 'Añadir a la lista'}>
                                        {esta ? '✓ En la lista' : 'Añadir'}
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
