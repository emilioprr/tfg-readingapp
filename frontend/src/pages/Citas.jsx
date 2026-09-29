import { useState, useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TarjetaCita from '../components/TarjetaCita'
import api from '../api/axios'

const TAMANIO = 20

const ORDENES = [
    { key: 'populares', label: 'Populares esta semana' },
    { key: 'recientes', label: 'Recientes' },
]

/** Muro de citas: frases de los libros compartidas por la comunidad, que se pueden likear y colgar en el perfil. */
export default function Citas() {
    const { usuario } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const orden = searchParams.get('orden') === 'recientes' ? 'recientes' : 'populares'
    const [citas, setCitas] = useState([])
    const [pagina, setPagina] = useState(0)
    const [hayMas, setHayMas] = useState(false)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        if (!usuario) return
        const cargar = async () => {
            setCargando(true)
            try {
                const res = await api.get(`/citas?orden=${orden}&page=0&size=${TAMANIO}`)
                setCitas(res.data.citas || [])
                setPagina(0)
                setHayMas(res.data.hayMas)
            } catch (err) { console.error('Error:', err) }
            finally { setCargando(false) }
        }
        cargar()
    }, [orden, usuario])

    const cargarMas = async () => {
        try {
            const res = await api.get(`/citas?orden=${orden}&page=${pagina + 1}&size=${TAMANIO}`)
            setCitas(prev => [...prev, ...(res.data.citas || [])])
            setPagina(p => p + 1)
            setHayMas(res.data.hayMas)
        } catch (err) { console.error('Error:', err) }
    }

    const toggleGuardar = async (cita) => {
        try {
            if (cita.guardada) await api.delete(`/citas/${cita.idanotacion}/guardar`)
            else await api.post(`/citas/${cita.idanotacion}/guardar`)
            setCitas(prev => prev.map(c => c.idanotacion === cita.idanotacion
                ? { ...c, guardada: !c.guardada, vecesGuardada: Math.max((c.vecesGuardada || 0) + (c.guardada ? -1 : 1), 0) }
                : c))
        } catch (err) { alert(err.response?.data?.mensaje || 'Error') }
    }

    if (!usuario) return <Navigate to="/login" />

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text tracking-tight">Citas</h1>
            <p className="text-dark-muted text-sm mt-1 mb-6">
                Frases de los libros que comparte la comunidad. Pulsa el marcador para colgar una en
                el <Link to="/perfil?tab=citas" className="text-terra hover:text-terra-hover transition-colors">mural de tu perfil</Link>.
                Para compartir una, crea una anotación de tipo cita y hazla pública.
            </p>

            <div className="flex gap-2 mb-6 border-b border-dark-border">
                {ORDENES.map((o) => (
                    <button key={o.key} onClick={() => setSearchParams(o.key === 'populares' ? {} : { orden: o.key })}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                                orden === o.key ? 'text-terra' : 'text-dark-muted hover:text-dark-text'}`}>
                        {o.label}
                        {orden === o.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terra rounded-full" />}
                    </button>
                ))}
            </div>

            {cargando ? <p className="text-dark-muted">Cargando...</p> : citas.length === 0 ? (
                <div className="bg-dark-card rounded-2xl py-12 px-6 text-center">
                    <p className="text-dark-muted">Todavía nadie ha compartido citas.</p>
                </div>
            ) : (
                <>
                    <div className="columns-1 md:columns-2 gap-4">
                        {citas.map((c) => (
                            <TarjetaCita key={c.idanotacion} cita={c} esMia={c.idusuario === usuario.id} onGuardar={toggleGuardar} />
                        ))}
                    </div>
                    {hayMas && (
                        <div className="flex justify-center mt-6">
                            <button onClick={cargarMas}
                                    className="border border-dark-border hover:border-terra hover:text-terra text-dark-muted px-6 py-2 rounded-lg text-sm transition-colors">
                                Cargar más
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
