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
        try { const res = await api.get(`/usuarios/buscar?nombre=${busqueda}`); setResultados(res.data.content || res.data || []); setBuscado(true) }
        catch (err) { console.error('Error:', err) }
    }
    const seguir = async (idSeguido) => {
        try { await api.post(`/usuarios/${usuario.id}/seguir/${idSeguido}`); alert('Ahora sigues a este usuario') }
        catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text mb-6 tracking-tight">Buscar usuarios</h1>
            <form onSubmit={handleBuscar} className="mb-6 flex gap-2">
                <input type="text" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                       className="flex-1 bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" />
                <button type="submit" className="bg-terra hover:bg-terra-hover text-white font-semibold px-4 py-2.5 rounded-lg transition-colors">Buscar</button>
            </form>
            {buscado && resultados.length === 0 && <p className="text-dark-muted">No se encontraron usuarios</p>}
            <div className="space-y-3">
                {resultados.map((u) => (
                    <div key={u.idusuario} className="bg-dark-card p-4 rounded-xl flex items-center justify-between">
                        <Link to={`/usuario/${u.idusuario}`} className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-terra/20 rounded-full flex items-center justify-center text-terra text-lg font-bold">{u.nombre?.charAt(0).toUpperCase()}</div>
                            <div><p className="text-dark-text font-medium hover:text-terra transition-colors">{u.nombre}</p><p className="text-dark-muted text-sm">{u.seguidores || 0} seguidores</p></div>
                        </Link>
                        {usuario && u.idusuario !== usuario.id && (
                            <button onClick={() => seguir(u.idusuario)} className="bg-terra hover:bg-terra-hover text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Seguir</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}