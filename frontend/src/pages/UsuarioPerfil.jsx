import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import api from '../api/axios'

export default function UsuarioPerfil() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const [perfil, setPerfil] = useState(null)
    const [resenas, setResenas] = useState([])
    const [siguiendo, setSiguiendo] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => { cargarPerfil(); cargarResenas() }, [id])
    const cargarPerfil = async () => {
        try { const res = await api.get(`/usuarios/${id}`); setPerfil(res.data) }
        catch (err) { console.error('Error:', err) } finally { setLoading(false) }
    }
    const cargarResenas = async () => {
        try { const res = await api.get(`/resenas/usuario/${id}/publicas?size=10`); setResenas(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }
    const toggleSeguir = async () => {
        try {
            if (siguiendo) await api.delete(`/usuarios/${usuario.id}/seguir/${id}`)
            else await api.post(`/usuarios/${usuario.id}/seguir/${id}`)
            setSiguiendo(!siguiendo); cargarPerfil()
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!perfil) return <p className="text-red-400">Usuario no encontrado</p>
    const esMio = usuario && usuario.id === parseInt(id)

    return (
        <div>
            <div className="bg-dark-card rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-6">
                    {perfil.avatar ? <img src={perfil.avatar} alt={perfil.nombre} className="w-20 h-20 rounded-full object-cover" />
                        : <div className="w-20 h-20 bg-terra/20 rounded-full flex items-center justify-center text-terra text-3xl font-bold">{perfil.nombre?.charAt(0).toUpperCase()}</div>}
                    <div>
                        <h1 className="text-2xl font-bold text-dark-text">{perfil.nombre}</h1>
                        {perfil.biografia && <p className="text-dark-text/80 mt-1">{perfil.biografia}</p>}
                        <p className="text-sm text-dark-muted mt-1">{perfil.seguidores || 0} seguidores</p>
                        {usuario && !esMio && (
                            <button onClick={toggleSeguir}
                                    className={`mt-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${siguiendo ? 'border border-dark-border text-dark-text hover:border-red-400 hover:text-red-400' : 'bg-terra hover:bg-terra-hover text-white'}`}>
                                {siguiendo ? 'Dejar de seguir' : 'Seguir'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {esMio ? (
                <p className="text-dark-muted">Este es tu perfil. <Link to="/perfil" className="text-terra hover:text-terra-hover transition-colors">Ir a mi perfil</Link></p>
            ) : (
                <div>
                    <h2 className="text-xl font-semibold text-dark-text mb-4">Reseñas públicas</h2>
                    {resenas.length === 0 ? <p className="text-dark-muted">No tiene reseñas públicas</p> : (
                        <div className="space-y-4">
                            {resenas.map((r) => (
                                <div key={r.idresena} className="bg-dark-card p-5 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <Link to={`/libro/${r.idlibro}`} className="text-terra font-medium hover:text-terra-hover transition-colors">{r.tituloLibro}</Link>
                                        <Estrellas puntuacion={r.puntuacion} />
                                    </div>
                                    {r.tieneSpoiler ? <p className="text-dark-muted italic">Contiene spoilers</p> : <p className="text-dark-text/80">{r.texto}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}