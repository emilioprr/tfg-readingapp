import { useState, useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

/** Seguidores y seguidos del usuario con sesión (se abre desde el desplegable del perfil). */
export default function Conexiones() {
    const { usuario } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const tab = searchParams.get('tab') === 'seguidos' ? 'seguidos' : 'seguidores'

    const [seguidores, setSeguidores] = useState([])
    const [seguidos, setSeguidos] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        if (!usuario) return
        const cargar = async () => {
            try {
                const [seguidoresRes, seguidosRes] = await Promise.all([
                    api.get(`/usuarios/${usuario.id}/seguidores`),
                    api.get(`/usuarios/${usuario.id}/seguidos`),
                ])
                setSeguidores(seguidoresRes.data || [])
                setSeguidos(seguidosRes.data || [])
            } catch (err) { console.error('Error:', err) }
            finally { setCargando(false) }
        }
        cargar()
    }, [usuario])

    const idsSeguidos = new Set(seguidos.map(u => u.idusuario))

    const toggleSeguir = async (otro) => {
        try {
            if (idsSeguidos.has(otro.idusuario)) {
                await api.delete(`/usuarios/${usuario.id}/seguir/${otro.idusuario}`)
                setSeguidos(prev => prev.filter(u => u.idusuario !== otro.idusuario))
            } else {
                await api.post(`/usuarios/${usuario.id}/seguir/${otro.idusuario}`)
                setSeguidos(prev => [...prev, otro])
            }
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    if (!usuario) return <Navigate to="/login" />

    const lista = tab === 'seguidores' ? seguidores : seguidos
    const tabs = [
        { key: 'seguidores', label: 'Seguidores', total: seguidores.length },
        { key: 'seguidos', label: 'Seguidos', total: seguidos.length },
    ]

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text mb-6 tracking-tight">Seguidores y seguidos</h1>

            <div className="flex gap-2 mb-6 border-b border-dark-border">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setSearchParams({ tab: t.key })}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                                tab === t.key ? 'text-terra' : 'text-dark-muted hover:text-dark-text'}`}>
                        {t.label} {!cargando && <span className="text-dark-muted font-normal">{t.total}</span>}
                        {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terra rounded-full" />}
                    </button>
                ))}
            </div>

            {cargando ? <p className="text-dark-muted">Cargando...</p> : lista.length === 0 ? (
                <p className="text-dark-muted text-sm">
                    {tab === 'seguidores' ? 'Todavía no te sigue nadie.' : 'Todavía no sigues a nadie.'}
                </p>
            ) : (
                <div className="bg-dark-card rounded-2xl p-2">
                    {lista.map((u) => {
                        const loSigo = idsSeguidos.has(u.idusuario)
                        return (
                            <div key={u.idusuario} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-dark-elevated/60 transition-colors">
                                <Link to={`/usuario/${u.idusuario}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                                    {u.avatar ? (
                                        <img src={u.avatar} alt={u.nombre} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-11 h-11 bg-terra/20 rounded-full flex items-center justify-center text-terra font-bold flex-shrink-0">
                                            {u.nombre?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-dark-text text-sm font-medium truncate group-hover:text-terra transition-colors">{u.nombre}</p>
                                        {u.biografia && <p className="text-dark-muted text-xs truncate">{u.biografia}</p>}
                                    </div>
                                </Link>
                                <button onClick={() => toggleSeguir(u)}
                                        className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                            loSigo
                                                ? 'border border-dark-border text-dark-text hover:border-red-400 hover:text-red-400'
                                                : 'bg-terra hover:bg-terra-hover text-white'
                                        }`}>
                                    {loSigo ? 'Dejar de seguir' : 'Seguir también'}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
