import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FilaActividad } from '../components/ActividadSeguidos'
import api from '../api/axios'
import { CaretLeft } from '@phosphor-icons/react'
import { useAvisos } from '../context/AvisosContext'

const TAMANIO = 20

/** Toda la actividad de las personas que sigues, de 20 en 20. */
export default function Actividad() {
    const { avisarCarga } = useAvisos()
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
            } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar la actividad.') }
            finally { setCargando(false) }
        }
        cargar()
    }, [avisarCarga, usuario])

    const cargarMas = async () => {
        setCargandoMas(true)
        try {
            const res = await api.get(`/actividad/seguidos/${usuario.id}?page=${pagina + 1}&size=${TAMANIO}`)
            setEventos(prev => [...prev, ...(res.data.eventos || [])])
            setPagina(p => p + 1)
            setHayMas(res.data.hayMas)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar más actividad.') }
        finally { setCargandoMas(false) }
    }

    if (!usuario) return <Navigate to="/login" />

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/" className="btn-texto"><CaretLeft size={14} /> Inicio</Link>
            <h1 className="font-serif text-4xl leading-none text-texto mt-2 mb-6">Actividad de las personas que sigues</h1>

            {cargando ? <p className="text-texto-sec">Cargando…</p> : eventos.length === 0 ? (
                <p className="font-serif text-xl text-texto-sec py-6">Las personas que sigues todavía no han movido ficha.</p>
            ) : (
                <>
                    <div className="divide-y divide-linea border-y border-linea">
                        {eventos.map((e, i) => <FilaActividad key={`${i}-${e.tipo}-${e.fecha}`} e={e} />)}
                    </div>
                    {hayMas && (
                        <div className="flex justify-center mt-6">
                            <button onClick={cargarMas} disabled={cargandoMas}
                                    className="btn-secundario">
                                {cargandoMas ? 'Cargando…' : 'Cargar más'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
