import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function MiWishlist() {
    const { usuario } = useAuth()
    const [libros, setLibros] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { cargarWishlist() }, [])

    const cargarWishlist = async () => {
        try {
            const res = await api.get(`/listas/usuario/${usuario.id}`)
            const listas = res.data.content || res.data || []
            const wishlist = listas.find(l => l.esAutomatica && l.nombre === 'Wishlist')
            if (wishlist) {
                const detalle = await api.get(`/listas/${wishlist.idlista}`)
                setLibros(detalle.data.libros || [])
            }
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div>
            <h1 className="text-2xl font-bold text-dark-text mb-6 tracking-tight">Mi Wishlist</h1>
            {libros.length === 0 ? (
                <div className="text-center py-10 bg-dark-card rounded-2xl">
                    <p className="text-dark-muted mb-2">Tu wishlist está vacía</p>
                    <Link to="/catalogo" className="text-terra hover:text-terra-hover text-sm transition-colors">Explorar libros</Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {libros.map((libro) => (
                        <Link key={libro.idlibro} to={`/libro/${libro.idlibro}`} className="group">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
                                {libros.map((libro) => <LibroCard key={libro.idlibro} libro={libro} className="w-full" />)}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}