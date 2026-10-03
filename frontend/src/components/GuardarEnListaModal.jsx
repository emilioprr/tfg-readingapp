import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { X, Plus } from '@phosphor-icons/react'
import { useAvisos } from '../context/AvisosContext'

/**
 * Ventana "Guardar en lista" de la ficha de un libro: tus listas con una casilla cada una
 * (marcada si el libro ya está), que añade o quita al momento, y crear una lista nueva ahí mismo.
 */
export default function GuardarEnListaModal({ idlibro, onClose }) {
    const { avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const [listas, setListas] = useState(null)
    const [pendientes, setPendientes] = useState(new Set()) // listas con una petición en curso
    const [creando, setCreando] = useState(false)
    const [nombreNueva, setNombreNueva] = useState('')
    const [error, setError] = useState('')

    const cargar = useCallback(async () => {
        try {
            const res = await api.get(`/listas/usuario/${usuario.id}/libro/${idlibro}`)
            setListas(res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar tus listas.'); setListas([]) }
    }, [avisarCarga, idlibro, usuario])

    useEffect(() => { cargar() }, [cargar])

    // Cerrar con Escape
    useEffect(() => {
        const alPulsar = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', alPulsar)
        return () => window.removeEventListener('keydown', alPulsar)
    }, [onClose])

    const alternar = async (lista) => {
        if (pendientes.has(lista.idlista)) return
        setError('')
        setPendientes(prev => new Set(prev).add(lista.idlista))
        const estaba = lista.contieneLibro
        // Se marca al momento; si falla, se deshace
        setListas(prev => prev.map(l => l.idlista === lista.idlista
            ? { ...l, contieneLibro: !estaba, numLibros: l.numLibros + (estaba ? -1 : 1) } : l))
        try {
            if (estaba) await api.delete(`/listas/${lista.idlista}/libros/${idlibro}`)
            else await api.post(`/listas/${lista.idlista}/libros/${idlibro}`)
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se ha podido guardar el cambio')
            setListas(prev => prev.map(l => l.idlista === lista.idlista ? lista : l))
        } finally {
            setPendientes(prev => { const s = new Set(prev); s.delete(lista.idlista); return s })
        }
    }

    const crearLista = async (e) => {
        e.preventDefault()
        const nombre = nombreNueva.trim()
        if (!nombre) return
        setError('')
        try {
            const res = await api.post(`/listas/usuario/${usuario.id}`, { nombre, esPublica: true })
            await api.post(`/listas/${res.data.idlista}/libros/${idlibro}`)
            setNombreNueva('')
            setCreando(false)
            cargar()
        } catch (err) { setError(err.response?.data?.mensaje || 'No se ha podido crear la lista') }
    }

    return (
        <div className="fixed inset-0 bg-fondo/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
            <div className="bg-superficie border border-linea rounded w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="font-serif text-2xl text-texto">Guardar en lista</h2>
                    <button onClick={onClose} className="text-texto-sec hover:text-texto" aria-label="Cerrar"><X size={18} /></button>
                </div>

                <div className="max-h-72 overflow-y-auto px-2">
                    {listas === null ? (
                        <p className="text-texto-sec text-sm px-3 py-4">Cargando…</p>
                    ) : listas.length === 0 && !creando ? (
                        <p className="text-texto-sec text-sm px-3 py-4">Todavía no tienes listas. Crea la primera:</p>
                    ) : (
                        listas.map((l) => (
                            <label key={l.idlista}
                                   className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-superficie-alta cursor-pointer">
                                <input type="checkbox" checked={!!l.contieneLibro} onChange={() => alternar(l)}
                                       disabled={pendientes.has(l.idlista)} className="accent-texto w-4 h-4" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-texto text-sm truncate">{l.nombre}</span>
                                    <span className="block text-texto-sec text-xs">
                                        {l.numLibros} {l.numLibros === 1 ? 'libro' : 'libros'} · {l.esPublica ? 'Pública' : 'Privada'}
                                    </span>
                                </span>
                            </label>
                        ))
                    )}
                </div>

                {error && <p className="text-error text-xs px-5 pt-2">{error}</p>}

                <div className="border-t border-linea mt-2 p-3">
                    {creando || listas?.length === 0 ? (
                        <form onSubmit={crearLista} className="flex gap-2">
                            <input autoFocus value={nombreNueva} onChange={(e) => setNombreNueva(e.target.value)} maxLength={100}
                                   placeholder="Nombre de la lista" aria-label="Nombre de la nueva lista"
                                   className="campo flex-1 min-w-0" />
                            <button type="submit" disabled={!nombreNueva.trim()}
                                    className="btn-acento">
                                Crear
                            </button>
                        </form>
                    ) : (
                        <button onClick={() => setCreando(true)}
                                className="w-full text-left px-3 py-2 text-sm text-texto-sec hover:text-texto hover:bg-superficie-alta rounded flex items-center gap-2">
                            <Plus size={14} /> Nueva lista
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
