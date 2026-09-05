import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LibroCard from '../components/LibroCard'
import api from '../api/axios'

export default function ListaDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [lista, setLista] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { cargarLista() }, [id])

    const cargarLista = async () => {
        try { const res = await api.get(`/listas/${id}`); setLista(res.data) }
        catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const quitarLibro = async (idlibro) => {
        try { await api.delete(`/listas/${id}/libros/${idlibro}`); cargarLista() }
        catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    const eliminarLista = async () => {
        if (!window.confirm('¿Eliminar esta lista?')) return
        try { await api.delete(`/listas/${id}`); navigate('/perfil') }
        catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!lista) return <p className="text-red-400">Lista no encontrada</p>

    const esMia = usuario && lista.idusuario === usuario.id
    const libros = lista.libros || []

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-dark-text tracking-tight">{lista.nombre}</h1>
                    {lista.descripcion && <p className="text-dark-muted mt-1">{lista.descripcion}</p>}
                    <div className="flex gap-3 mt-3 text-xs">
                        {lista.esPublica ? (
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">Pública</span>
                        ) : (
                            <span className="bg-dark-elevated text-dark-muted px-2 py-1 rounded-full">Privada</span>
                        )}
                        {lista.esAutomatica && (
                            <span className="bg-terra/20 text-terra px-2 py-1 rounded-full">Automática</span>
                        )}
                        <span className="text-dark-muted">{libros.length} libros</span>
                    </div>
                </div>
                {esMia && !lista.esAutomatica && (
                    <button onClick={eliminarLista} className="text-red-400 hover:text-red-300 text-sm transition-colors">
                        Eliminar lista
                    </button>
                )}
            </div>

            {libros.length === 0 ? (
                <div className="text-center py-16 bg-dark-card rounded-2xl">
                    <p className="text-dark-muted">Esta lista está vacía</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
                    {libros.map((libro) => (
                        <div key={libro.idlibro} className="group relative">
                            <LibroCard libro={libro} className="w-full" />
                            {esMia && !lista.esAutomatica && (
                                <button onClick={() => quitarLibro(libro.idlibro)}
                                        className="absolute top-1 right-1 bg-black/60 text-red-400 hover:text-red-300 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}