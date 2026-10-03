import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TarjetaCita from './TarjetaCita'
import api from '../api/axios'
import { useAvisos } from '../context/AvisosContext'

const TAMANIO = 20

/** Pestaña "Mural de citas" del perfil: las citas de otros lectores que el usuario ha elegido exhibir. */
export default function MuralCitas({ perfilId, esMio, usuario }) {
    const { avisar, avisarCarga } = useAvisos()
    const [citas, setCitas] = useState([])
    const [pagina, setPagina] = useState(0)
    const [hayMas, setHayMas] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    const ruta = `/citas/guardadas/usuario/${perfilId}`

    useEffect(() => {
        const cargar = async () => {
            setCargando(true)
            setError(null)
            try {
                const res = await api.get(`${ruta}?page=0&size=${TAMANIO}`)
                setCitas(res.data.citas || [])
                setPagina(0)
                setHayMas(res.data.hayMas)
            } catch (err) {
                console.error('Error:', err); avisarCarga(err, 'No se han podido cargar las citas del mural.')
                setError('No hemos podido cargar el mural. Prueba de nuevo en un momento.')
            }
            finally { setCargando(false) }
        }
        cargar()
    }, [avisarCarga, ruta])

    const cargarMas = async () => {
        try {
            const res = await api.get(`${ruta}?page=${pagina + 1}&size=${TAMANIO}`)
            setCitas(prev => [...prev, ...(res.data.citas || [])])
            setPagina(p => p + 1)
            setHayMas(res.data.hayMas)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se han podido cargar más citas.') }
    }

    const toggleGuardar = async (cita) => {
        try {
            if (cita.guardada) await api.delete(`/citas/${cita.idanotacion}/guardar`)
            else await api.post(`/citas/${cita.idanotacion}/guardar`)
            // En tu perfil, quitarla la saca del mural; en el de otro solo cambia tu marcador
            if (esMio && cita.guardada) {
                setCitas(prev => prev.filter(c => c.idanotacion !== cita.idanotacion))
            } else {
                setCitas(prev => prev.map(c => c.idanotacion === cita.idanotacion
                    ? { ...c, guardada: !c.guardada, vecesGuardada: Math.max((c.vecesGuardada || 0) + (c.guardada ? -1 : 1), 0) }
                    : c))
            }
        } catch (err) { avisar(err.response?.data?.mensaje || 'Algo ha fallado. Inténtalo de nuevo.') }
    }

    if (cargando) return <p className="text-texto-sec">Cargando…</p>
    if (error) return <p className="text-error text-sm">{error}</p>

    if (citas.length === 0) {
        return (
            <div className="py-6">
                <p className="font-serif text-xl text-texto-sec mb-3">
                    {esMio ? 'Tu mural está vacío. Cuelga en él las citas que te definen.' : 'Su mural de citas está vacío'}
                </p>
                {esMio && (
                    <Link to="/citas" className="inline-block mt-3 text-acento hover:text-acento-hover text-sm transition-colors">
                        Descubre citas de la comunidad
                    </Link>
                )}
            </div>
        )
    }

    return (
        <>
            <div className="columns-1 md:columns-2 gap-4">
                {citas.map((c) => (
                    <TarjetaCita key={c.idanotacion} cita={c} esMia={c.idusuario === usuario?.id} onGuardar={toggleGuardar} />
                ))}
            </div>
            {hayMas && (
                <div className="flex justify-center mt-6">
                    <button onClick={cargarMas}
                            className="btn-secundario">
                        Cargar más
                    </button>
                </div>
            )}
        </>
    )
}
