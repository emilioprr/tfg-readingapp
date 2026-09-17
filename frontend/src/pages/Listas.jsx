import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import ListaCard from '../components/ListaCard'

export default function Listas() {
    const { usuario } = useAuth()
    const [publicas, setPublicas] = useState([])
    const [misListas, setMisListas] = useState([])
    const [listasAmigos, setListasAmigos] = useState([])
    const [tab, setTab] = useState('explorar')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cargarPublicas()
        if (usuario) {
            cargarMisListas()
            cargarListasAmigos()
        }
    }, [usuario])

    const cargarPublicas = async () => {
        try {
            const res = await api.get('/listas/publicas')
            const todas = res.data.content || res.data || []
            setPublicas(todas.filter(l => !l.esAutomatica && (!usuario || l.idusuario !== usuario.id)))
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const cargarMisListas = async () => {
        try {
            const res = await api.get(`/listas/usuario/${usuario.id}`)
            setMisListas(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err) }
    }

    const cargarListasAmigos = async () => {
        try {
            const res = await api.get(`/usuarios/${usuario.id}/seguidos`)
            const seguidos = res.data || []
            const todasListas = []
            for (const seguido of seguidos) {
                try {
                    const resListas = await api.get(`/listas/usuario/${seguido.idusuario}`)
                    const listas = (resListas.data.content || resListas.data || [])
                        .filter(l => l.esPublica)
                        .map(l => ({ ...l, nombreUsuario: seguido.nombre }))
                    todasListas.push(...listas)
                } catch (err) { /* ignorar */ }
            }
            setListasAmigos(todasListas)
        } catch (err) { console.error('Error:', err) }
    }

    const tabs = [
        { key: 'explorar', label: 'Explorar' },
        ...(usuario ? [{ key: 'amigos', label: 'Listas de amigos' }] : []),
        ...(usuario ? [{ key: 'mis-listas', label: 'Mis listas' }] : []),
    ]

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-dark-text tracking-tight">Listas</h1>
                {usuario && (
                    <Link to="/crear-lista"
                          className="text-sm bg-terra hover:bg-terra-hover text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        + Nueva lista
                    </Link>
                )}
            </div>

            {tabs.length > 1 && (
                <div className="flex gap-2 mb-8 border-b border-dark-border">
                    {tabs.map((t) => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                                    tab === t.key ? 'text-terra' : 'text-dark-muted hover:text-dark-text'
                                }`}>
                            {t.label}
                            {tab === t.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terra rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {tab === 'explorar' && (
                <>
                    {publicas.length === 0 ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted">No hay listas públicas todavía</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {publicas.map((lista) => (
                                <ListaCard key={lista.idlista} lista={lista} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {tab === 'amigos' && (
                <>
                    {listasAmigos.length === 0 ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted">Tus amigos no tienen listas públicas</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {listasAmigos.map((lista) => (
                                <ListaCard key={lista.idlista} lista={lista} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {tab === 'mis-listas' && (
                <>
                    {misListas.length === 0 ? (
                        <div className="text-center py-16 bg-dark-card rounded-2xl">
                            <p className="text-dark-muted mb-2">No tienes listas todavía</p>
                            <Link to="/crear-lista" className="text-terra hover:text-terra-hover text-sm transition-colors">
                                Crear tu primera lista
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {misListas.map((lista) => (
                                <ListaCard key={lista.idlista} lista={lista} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}