import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FilaActividad } from '../components/ActividadSeguidos'
import api from '../api/axios'

const TAMANIO = 20

/** Toda la actividad de las personas que sigues, de 20 en 20. */
export default function Actividad() {
    const { usuario } = useAuth()
    const [eventos, setEventos] = useState([])
    const [pagina, setPagina] = useState(0)
    const [hayMas, setHayMas] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [cargandoMas, setCargandoMas] = useState(false)

    useEffect(() => {
        if (!usuario) return
        const cargar = async () => {
            try {
                const res = await api.get(`/actividad/seguidos/${usuario.id}?page=0&size=${TAMANIO}`)
                setEventos(res.data.eventos || [])
                setHayMas(res.data.hayMas)
            } catch (err) { console.error('Error:', err) }
            finally { setCargando(false) }
        }
        cargar()
    }, [usuario])

    const cargarMas = async () => {
        setCargandoMas(true)
        try {
            const res = await api.get(`/actividad/seguidos/${usuario.id}?page=${pagina + 1}&size=${TAMANIO}`)
            setEventos(prev => [...prev, ...(res.data.eventos || [])])
            setPagina(p => p + 1)
            setHayMas(res.data.hayMas)
        } catch (err) { console.error('Error:', err) }
        finally { setCargandoMas(false) }
    }

    if (!usuario) return <Navigate to="/login" />

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/" className="text-sm text-dark-muted hover:text-terra transition-colors">‹ Inicio</Link>
            <h1 className="text-2xl font-bold text-dark-text tracking-tight mt-2 mb-6">Actividad de las personas que sigues</h1>

            {cargando ? <p className="text-dark-muted">Cargando...</p> : eventos.length === 0 ? (
                <div className="bg-dark-card rounded-2xl p-6 text-center">
                    <p className="text-dark-muted text-sm">Todavía no hay actividad de las personas que sigues.</p>
                </div>
            ) : (
                <>
                    <div className="bg-dark-card rounded-2xl divide-y divide-dark-border">
                        {eventos.map((e, i) => <FilaActividad key={`${i}-${e.tipo}-${e.fecha}`} e={e} />)}
                    </div>
                    {hayMas && (
                        <div className="flex justify-center mt-6">
                            <button onClick={cargarMas} disabled={cargandoMas}
                                    className="border border-dark-border hover:border-terra hover:text-terra text-dark-muted px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                                {cargandoMas ? 'Cargando...' : 'Cargar más'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
