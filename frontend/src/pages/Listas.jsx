import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Plus } from '@phosphor-icons/react'
import ListaCard from '../components/ListaCard'
import Pestanas from '../components/Pestanas'
import { useAvisos } from '../context/AvisosContext'

export default function Listas() {
    const { avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const [publicas, setPublicas] = useState([])
    const [misListas, setMisListas] = useState([])
    const [listasAmigos, setListasAmigos] = useState([])
    const [tab, setTab] = useState('explorar')
    const [loading, setLoading] = useState(true)

    const cargarPublicas = useCallback(async () => {
        try {
            const res = await api.get('/listas/publicas')
            const todas = res.data.content || res.data || []
            setPublicas(todas.filter(l => !usuario || l.idusuario !== usuario.id))
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar las listas.') }
        finally { setLoading(false) }
    }, [avisarCarga, usuario])

    const cargarMisListas = useCallback(async () => {
        try {
            const res = await api.get(`/listas/usuario/${usuario.id}`)
            setMisListas(res.data.content || res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar las listas.') }
    }, [avisarCarga, usuario])

    const cargarListasAmigos = useCallback(async () => {
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
                } catch { /* ignorar */ }
            }
            setListasAmigos(todasListas)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar las listas.') }
    }, [avisarCarga, usuario])

    useEffect(() => {
        cargarPublicas()
        if (usuario) {
            cargarMisListas()
            cargarListasAmigos()
        }
    }, [cargarListasAmigos, cargarMisListas, cargarPublicas, usuario])

    const tabs = [
        { key: 'explorar', label: 'Explorar' },
        ...(usuario ? [{ key: 'amigos', label: 'Listas de amigos' }] : []),
        ...(usuario ? [{ key: 'mis-listas', label: 'Mis listas' }] : []),
    ]

    if (loading) return <p className="text-texto-sec">Cargando…</p>

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-serif text-4xl leading-none text-texto">Listas</h1>
                {usuario && (
                    <Link to="/crear-lista" className="btn-acento">
                        <Plus size={14} /> Nueva lista
                    </Link>
                )}
            </div>

            {tabs.length > 1 && (
                <Pestanas pestanas={tabs} activa={tab} onCambiar={setTab} className="mb-8" />
            )}

            {tab === 'explorar' && (
                <>
                    {publicas.length === 0 ? (
                        <div className="py-6">
                            <p className="font-serif text-xl text-texto-sec mb-3">Nadie ha publicado una lista todavía. Puedes ser la primera persona.</p>
                        </div>
                    ) : (
                        <div className="border-t border-linea">
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
                        <div className="py-6">
                            <p className="font-serif text-xl text-texto-sec mb-3">Tus amigos no tienen listas públicas</p>
                        </div>
                    ) : (
                        <div className="border-t border-linea">
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
                        <div className="py-6">
                            <p className="font-serif text-xl text-texto-sec mb-3">Todavía no has hecho ninguna lista.</p>
                            <Link to="/crear-lista" className="text-acento hover:text-acento-hover text-sm transition-colors">
                                Crear tu primera lista
                            </Link>
                        </div>
                    ) : (
                        <div className="border-t border-linea">
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