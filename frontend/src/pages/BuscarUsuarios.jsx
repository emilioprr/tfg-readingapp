import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function BuscarUsuarios() {
    const { usuario } = useAuth()
    const [busqueda, setBusqueda] = useState('')
    const [resultados, setResultados] = useState([])
    const [buscado, setBuscado] = useState(false)

    const handleBuscar = async (e) => {
        e.preventDefault()
        if (!busqueda.trim()) return
        try {
            const res = await api.get(`/usuarios/buscar?nombre=${busqueda}`)
            setResultados(res.data.content || res.data || [])
            setBuscado(true)
        } catch (err) {
            console.error('Error buscando usuarios:', err)
        }
    }

    const seguir = async (idSeguido) => {
        try {
            await api.post(`/usuarios/${usuario.id}/seguir/${idSeguido}`)
            alert('Ahora sigues a este usuario')
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error al seguir')
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-amber-400 mb-6">Buscar usuarios</h1>

            <form onSubmit={handleBuscar} className="mb-6 flex gap-2">
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                />
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-4 py-2 rounded">
                    Buscar
                </button>
            </form>

            {buscado && resultados.length === 0 && (
                <p className="text-gray-500">No se encontraron usuarios</p>
            )}

            <div className="space-y-3">
                {resultados.map((u) => (
                    <div key={u.idusuario} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex items-center justify-between">
                        <Link to={`/usuario/${u.idusuario}`} className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-lg font-bold">
                                {u.nombre?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-gray-200 font-medium hover:text-amber-400">{u.nombre}</p>
                                <p className="text-gray-500 text-sm">{u.seguidores || 0} seguidores</p>
                            </div>
                        </Link>
                        {usuario && u.idusuario !== usuario.id && (
                            <button onClick={() => seguir(u.idusuario)}
                                    className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-4 py-2 rounded text-sm">
                                Seguir
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}