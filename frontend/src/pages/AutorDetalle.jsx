import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LibroCard from '../components/LibroCard'
import api from '../api/axios'
import TextoDesplegable from '../components/TextoDesplegable'
import { useAvisos } from '../context/AvisosContext'

export default function AutorDetalle() {
    const { avisar, avisarCarga } = useAvisos()
    const { id } = useParams()
    const { usuario } = useAuth()
    const [autor, setAutor] = useState(null)
    const [libros, setLibros] = useState([])
    const [siguiendo, setSiguiendo] = useState(false)
    const [loading, setLoading] = useState(true)

    const cargarAutor = useCallback(async () => {
        try { const res = await api.get(`/autores/${id}`); setAutor(res.data) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar el autor.') }
        finally { setLoading(false) }
    }, [avisarCarga, id])

    const cargarLibros = useCallback(async () => {
        try { const res = await api.get(`/libros/autor/${id}`); setLibros(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar sus libros.') }
    }, [avisarCarga, id])

    useEffect(() => { cargarAutor(); cargarLibros() }, [cargarAutor, cargarLibros, id])

    const toggleSeguir = async () => {
        try {
            if (siguiendo) await api.delete(`/autores/${id}/seguir/${usuario.id}`)
            else await api.post(`/autores/${id}/seguir/${usuario.id}`)
            setSiguiendo(!siguiendo); cargarAutor()
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    if (loading) return <p className="text-texto-sec">Cargando…</p>
    if (!autor) return <p className="font-serif text-xl text-texto-sec">Este autor no existe o no se ha podido cargar.</p>

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header centrado */}
            <div className="text-center mb-12">
                <div className="flex justify-center mb-4">
                    {autor.foto ? (
                        <img src={autor.foto} alt={autor.nombre}
                             className="w-28 h-28 rounded-full object-cover border border-linea" />
                    ) : (
                        <div className="w-28 h-28 border border-linea rounded-full flex items-center justify-center text-texto-sec font-serif text-5xl">
                            {autor.nombre?.charAt(0)}
                        </div>
                    )}
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight text-texto">{autor.nombre}</h1>

                {autor.nacionalidad && (
                    <p className="text-texto-sec text-sm mt-1">{autor.nacionalidad}</p>
                )}

                <div className="flex items-center justify-center gap-3 mt-3 text-sm text-texto-sec tabular-nums">
                    <span>{autor.seguidores || 0} seguidores</span>
                    <span className="text-texto-ter">·</span>
                    <span>{libros.length} libros</span>
                </div>

                {usuario && (
                    <button onClick={toggleSeguir}
                            className={`mt-5 ${siguiendo ? 'btn-secundario' : 'btn-acento'}`}>
                        {siguiendo ? 'Dejar de seguir' : 'Seguir'}
                    </button>
                )}

                {autor.biografia && (
                    <TextoDesplegable texto={autor.biografia} lineas={5} className="font-serif text-texto/85 text-[17px] leading-[1.65] max-w-[60ch] mx-auto mt-8" />
                )}
            </div>

            {/* Libros */}
            <div className="border-t border-linea pt-8">
                <h2 className="etiqueta mb-6">Libros</h2>
                {libros.length === 0 ? (
                    <p className="font-serif text-xl text-texto-sec">Todavía no hay libros suyos en el catálogo.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
                        {libros.map((libro) => (
                            <LibroCard key={libro.idlibro} libro={libro} className="w-full" />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}