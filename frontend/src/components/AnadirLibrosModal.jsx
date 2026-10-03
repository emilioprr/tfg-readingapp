import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { X, Check } from '@phosphor-icons/react'
import Portada from './Portada'
import { useAvisos } from '../context/AvisosContext'

/** Buscador para añadir libros a una lista sin salir de ella. */
export default function AnadirLibrosModal({ idlista, idsEnLista, onCambio, onClose }) {
    const { avisarCarga } = useAvisos()
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
            } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido buscar. Inténtalo de nuevo.') }
            finally { if (numero === ultimaBusqueda.current) setBuscando(false) }
        }, 300)
        return () => clearTimeout(t)
    }, [avisarCarga, query])

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
        <div className="fixed inset-0 bg-fondo/70 flex items-start sm:items-center justify-center z-50 px-4 pt-16 sm:pt-0" onClick={onClose}>
            <div className="bg-superficie border border-linea rounded w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="font-serif text-2xl text-texto">Añadir libros</h2>
                    <button onClick={onClose} className="text-texto-sec hover:text-texto" aria-label="Cerrar"><X size={18} /></button>
                </div>
                <div className="px-5">
                    <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busca por título…" aria-label="Buscar libros por título"
                           className="campo" />
                </div>
                {error && <p className="text-error text-xs px-5 pt-2">{error}</p>}

                <div className="max-h-96 overflow-y-auto p-2 mt-2">
                    {query.trim().length < 2 ? (
                        <p className="text-texto-sec text-sm px-3 py-6 text-center">Escribe al menos dos letras del título</p>
                    ) : buscando && resultados.length === 0 ? (
                        <p className="text-texto-sec text-sm px-3 py-6 text-center">Buscando…</p>
                    ) : resultados.length === 0 ? (
                        <p className="text-texto-sec text-sm px-3 py-6 text-center">No hay libros con ese título en el catálogo</p>
                    ) : (
                        resultados.map((libro) => {
                            const esta = enLista.has(libro.idlibro)
                            return (
                                <div key={libro.idlibro} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-superficie-alta">
                                    <Portada src={libro.portada} titulo={libro.titulo} autor={libro.nombreAutor} id={libro.idlibro} elevar={false} className="w-9 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-serif text-texto truncate">{libro.titulo}</p>
                                        <p className="text-texto-sec text-xs truncate">{libro.nombreAutor}</p>
                                    </div>
                                    <button onClick={() => alternar(libro)}
                                            className={`flex-shrink-0 px-3 py-1.5 text-xs ${esta ? 'btn-secundario' : 'btn-acento'}`}
                                            title={esta ? 'Quitar de la lista' : 'Añadir a la lista'}>
                                        {esta ? <><Check size={12} /> En la lista</> : 'Añadir'}
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
