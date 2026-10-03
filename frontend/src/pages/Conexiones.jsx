import { useState, useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Pestanas from '../components/Pestanas'
import { useAvisos } from '../context/AvisosContext'

/** Seguidores y seguidos del usuario con sesión (se abre desde el desplegable del perfil). */
export default function Conexiones() {
    const { avisar, avisarCarga } = useAvisos()
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
            } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar tus seguidores y seguidos.') }
            finally { setCargando(false) }
        }
        cargar()
    }, [avisarCarga, usuario])

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
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    if (!usuario) return <Navigate to="/login" />

    const lista = tab === 'seguidores' ? seguidores : seguidos
    const tabs = [
        { key: 'seguidores', label: 'Seguidores', total: seguidores.length },
        { key: 'seguidos', label: 'Seguidos', total: seguidos.length },
    ]

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-4xl sm:text-5xl leading-none tracking-tight text-texto mb-8">Seguidores y seguidos</h1>

            <Pestanas activa={tab} onCambiar={(k) => setSearchParams({ tab: k })} className="mb-2"
                      pestanas={tabs.map((t) => ({ key: t.key, label: <>{t.label} {!cargando && <span className="text-texto-ter font-normal tabular-nums ml-1">{t.total}</span>}</> }))} />

            {cargando ? <p className="text-texto-sec py-6">Cargando…</p> : lista.length === 0 ? (
                <p className="font-serif text-xl text-texto-sec py-6">
                    {tab === 'seguidores' ? 'Todavía no te sigue nadie.' : 'Todavía no sigues a nadie. Búscalos en el buscador, en «Usuarios».'}
                </p>
            ) : (
                <div className="divide-y divide-linea">
                    {lista.map((u) => {
                        const loSigo = idsSeguidos.has(u.idusuario)
                        return (
                            <div key={u.idusuario} className="flex items-center gap-4 py-4">
                                <Link to={`/usuario/${u.idusuario}`} className="flex items-center gap-4 flex-1 min-w-0 group">
                                    {u.avatar ? (
                                        <img src={u.avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-linea" />
                                    ) : (
                                        <div className="w-11 h-11 border border-linea rounded-full flex items-center justify-center text-texto-sec font-serif text-lg flex-shrink-0">
                                            {u.nombre?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-serif text-lg text-texto truncate group-hover:text-acento">{u.nombre}</p>
                                        {u.biografia && <p className="text-texto-sec text-sm truncate">{u.biografia}</p>}
                                    </div>
                                </Link>
                                <button onClick={() => toggleSeguir(u)}
                                        className={`flex-shrink-0 ${loSigo ? 'btn-secundario' : 'btn-acento'}`}>
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
