import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { X } from '@phosphor-icons/react'
import { useAvisos } from '../context/AvisosContext'

export default function EditarLibro() {
    const { avisarCarga } = useAvisos()
    const { id } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [titulo, setTitulo] = useState('')
    const [sinopsis, setSinopsis] = useState('')
    const [genero, setGenero] = useState('')
    const [numPaginas, setNumPaginas] = useState('')
    const [portada, setPortada] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    const cargarLibro = useCallback(async () => {
        try {
            const res = await api.get(`/libros/${id}`)
            const libro = res.data
            setTitulo(libro.titulo || '')
            setSinopsis(libro.sinopsis || '')
            setGenero(libro.genero || '')
            setNumPaginas(libro.numPaginas || '')
            setPortada(libro.portada || '')
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar el libro para editarlo.') }
        finally { setLoading(false) }
    }, [avisarCarga, id])

    useEffect(() => { cargarLibro() }, [cargarLibro, id])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await api.put(`/libros/${id}`, { titulo, sinopsis, genero, numPaginas: numPaginas ? parseInt(numPaginas) : null, portada })
            navigate(`/libro/${id}`)
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al actualizar')
        }
    }

    if (loading) return <p className="text-texto-sec">Cargando…</p>
    if (!usuario || usuario.rol !== 'ADMIN') return <p className="text-error">No tienes permiso</p>

    return (
        <div className="max-w-lg mx-auto">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <p className="etiqueta mb-2">Administración</p>
                    <h1 className="font-serif text-4xl leading-none tracking-tight text-texto">Editar libro</h1>
                </div>
                <button onClick={() => navigate(-1)} className="text-texto-sec hover:text-texto" aria-label="Cerrar"><X size={22} /></button>
            </div>
            {error && <p className="text-error text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="etiqueta block mb-2">Título</label>
                    <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                           className="campo" required />
                </div>
                <div>
                    <label className="etiqueta block mb-2">Sinopsis</label>
                    <textarea value={sinopsis} onChange={(e) => setSinopsis(e.target.value)} rows={6}
                              className="campo font-serif text-base leading-relaxed" />
                </div>
                <div>
                    <label className="etiqueta block mb-2">Género</label>
                    <input type="text" value={genero} onChange={(e) => setGenero(e.target.value)}
                           className="campo" />
                </div>
                <div>
                    <label className="etiqueta block mb-2">Páginas</label>
                    <input type="number" value={numPaginas} onChange={(e) => setNumPaginas(e.target.value)}
                           className="campo w-32" />
                </div>
                <div>
                    <label className="etiqueta block mb-2">URL de portada</label>
                    <input type="text" value={portada} onChange={(e) => setPortada(e.target.value)}
                           className="campo" />
                </div>
                <button type="submit" className="btn-acento w-full py-2.5">Guardar cambios</button>
            </form>
        </div>
    )
}