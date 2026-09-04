import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Estrellas from '../components/Estrellas'
import api from '../api/axios'

export default function LibroDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const [libro, setLibro] = useState(null)
    const [resenas, setResenas] = useState([])
    const [estadoLibro, setEstadoLibro] = useState(null)
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
    const [listas, setListas] = useState([])
    const [mostrarListas, setMostrarListas] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarLibro(); cargarResenas(); cargarEstado(); cargarListas()
    }, [id, usuario])

    const cargarLibro = async () => {
        try { const res = await api.get(`/libros/${id}`); setLibro(res.data) }
        catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }
    const cargarResenas = async () => {
        try { const res = await api.get(`/resenas/libro/${id}?size=5`); setResenas(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }
    const cargarEstado = async () => {
        if (!usuario) return
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/libro/${id}`)
            const datos = res.data || []
            if (datos.length > 0) setEstadoLibro(datos[datos.length - 1].estado)
        } catch (err) { console.error('Error:', err) }
    }
    const cargarListas = async () => {
        if (!usuario) return
        try { const res = await api.get(`/listas/usuario/${usuario.id}`); setListas(res.data.content || res.data || []) }
        catch (err) { console.error('Error:', err) }
    }
    const marcarLeyendo = async () => {
        try { await api.post('/seguimientos', { estado: 'LEYENDO', idusuario: usuario.id, idlibro: parseInt(id) }); setEstadoLibro('LEYENDO') }
        catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }
    const agregarFavorito = async () => {
        try { await api.post(`/libros/${id}/favorito/${usuario.id}`); alert('Añadido a favoritos') }
        catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }
    const agregarALista = async (idlista) => {
        try { await api.post(`/listas/${idlista}/libros/${id}`); setMostrarListas(false); alert('Añadido') }
        catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }
    const agregarAWishlist = async () => {
        const wishlist = listas.find(l => l.esAutomatica && l.nombre === 'Wishlist')
        if (wishlist) agregarALista(wishlist.idlista)
        else alert('No se encontró tu wishlist')
    }

    const getColorNota = (nota) => {
        if (nota < 2) return '#ef4444'
        if (nota < 4) return '#f97316'
        if (nota < 5) return '#ca8a04'
        if (nota < 6) return '#eab308'
        if (nota < 7) return '#84cc16'
        if (nota < 8) return '#22c55e'
        if (nota < 9) return '#c45d3e'
        return '#a855f7'
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>
    if (!libro) return <p className="text-red-400">Libro no encontrado</p>
    const listasNormales = listas.filter(l => !l.esAutomatica)

    return (
        <div>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0 relative">
                    {libro.notaMedia && (
                        <div className="absolute -top-3 -left-3 z-10 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-lg"
                             style={{ backgroundColor: getColorNota(libro.notaMedia) }}>{libro.notaMedia}</div>
                    )}
                    {libro.portada ? (
                        <img src={libro.portada} alt={libro.titulo} className="w-48 h-72 object-cover rounded-xl" />
                    ) : (
                        <div className="w-48 h-72 bg-dark-elevated rounded-xl flex items-center justify-center text-dark-muted">Sin portada</div>
                    )}
                    {libro.numResenas > 0 && <p className="text-xs text-dark-muted text-center mt-2">{libro.numResenas} reseñas</p>}
                </div>

                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-dark-text mb-2 tracking-tight">{libro.titulo}</h1>
                    <Link to={`/autor/${libro.idautor}`} className="text-dark-muted hover:text-terra text-lg transition-colors">{libro.nombreAutor}</Link>
                    <div className="flex gap-4 mt-2 text-sm text-dark-muted">
                        {libro.genero && <span className="bg-dark-elevated px-2.5 py-0.5 rounded">{libro.genero}</span>}
                        {libro.anioPublicacion && <span>{libro.anioPublicacion}</span>}
                        {libro.numPaginas && <span>{libro.numPaginas} páginas</span>}
                    </div>
                    {libro.sinopsis && <p className="text-dark-text/80 mt-4 leading-relaxed">{libro.sinopsis}</p>}

                    {usuario && (
                        <div className="flex flex-wrap gap-3 mt-6">
                            {estadoLibro === 'LEYENDO' ? (
                                <Link to={`/libro/${id}/seguimiento`} className="bg-terra hover:bg-terra-hover text-white font-semibold px-5 py-2 rounded-lg transition-colors">Seguimiento</Link>
                            ) : (
                                <button onClick={() => setMostrarConfirmacion(true)} className="bg-terra hover:bg-terra-hover text-white font-semibold px-5 py-2 rounded-lg transition-colors">Empezar a leer</button>
                            )}
                            <button onClick={agregarFavorito} className="border border-dark-border text-dark-text hover:border-terra hover:text-terra px-4 py-2 rounded-lg transition-colors">♥ Favorito</button>
                            <button onClick={agregarAWishlist} className="border border-dark-border text-dark-text hover:border-terra hover:text-terra px-4 py-2 rounded-lg transition-colors">☆ Wishlist</button>
                            <div className="relative">
                                <button onClick={() => setMostrarListas(!mostrarListas)} className="border border-dark-border text-dark-text hover:border-terra hover:text-terra px-4 py-2 rounded-lg transition-colors">+ Lista</button>
                                {mostrarListas && (
                                    <div className="absolute top-12 left-0 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-50 w-56 overflow-hidden">
                                        {listasNormales.length === 0 ? <p className="p-3 text-dark-muted text-sm">No tienes listas</p> : (
                                            listasNormales.map((lista) => (
                                                <button key={lista.idlista} onClick={() => agregarALista(lista.idlista)}
                                                        className="w-full text-left px-4 py-2.5 text-dark-text hover:bg-dark-elevated text-sm transition-colors">{lista.nombre}</button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            <Link to={`/libro/${id}/resena`} className="border border-dark-border text-dark-text hover:border-terra hover:text-terra px-4 py-2 rounded-lg transition-colors">Escribir reseña</Link>
                            <Link to={`/libro/${id}/recomendar`} className="border border-dark-border text-dark-text hover:border-terra hover:text-terra px-4 py-2 rounded-lg transition-colors">Recomendar</Link>
                            {estadoLibro === 'LEYENDO' && (
                                <Link to={`/libro/${id}/anotaciones`} className="border border-dark-border text-dark-text hover:border-terra hover:text-terra px-4 py-2 rounded-lg transition-colors">Anotaciones</Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-12">
                <h2 className="text-xl font-semibold text-dark-text mb-5">Reseñas</h2>
                {resenas.length === 0 ? <p className="text-dark-muted">Aún no hay reseñas</p> : (
                    <div className="space-y-4">
                        {resenas.map((r) => (
                            <div key={r.idresena} className="bg-dark-card p-5 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-terra font-medium">{r.nombreUsuario}</span>
                                    <Estrellas puntuacion={r.puntuacion} />
                                </div>
                                {r.tieneSpoiler ? <p className="text-dark-muted italic">Contiene spoilers</p> : <p className="text-dark-text/80">{r.texto}</p>}
                                {r.etiquetas?.length > 0 && (
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                        {r.etiquetas.map((et) => <span key={et} className="text-xs bg-terra/10 text-terra px-2.5 py-1 rounded-full">{et}</span>)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {mostrarConfirmacion && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-dark-text mb-2">¿Empezar a leer?</h3>
                        <p className="text-dark-muted mb-6">{libro.titulo}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setMostrarConfirmacion(false)} className="px-4 py-2 text-dark-muted hover:text-dark-text transition-colors">Cancelar</button>
                            <button onClick={async () => { await marcarLeyendo(); setMostrarConfirmacion(false) }}
                                    className="bg-terra hover:bg-terra-hover text-white font-semibold px-4 py-2 rounded-lg transition-colors">Sí, empezar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}