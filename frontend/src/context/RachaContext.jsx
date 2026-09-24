import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import api from '../api/axios'

const RachaContext = createContext(null)

export function RachaProvider({ children }) {
    const { usuario } = useAuth()
    const [racha, setRacha] = useState(null)
    const [celebracion, setCelebracion] = useState(null)
    const rachaRef = useRef(null)

    const cargar = async () => {
        if (!usuario) return null
        try {
            const res = await api.get(`/racha/usuario/${usuario.id}`)
            rachaRef.current = res.data
            setRacha(res.data)
            return res.data
        } catch (err) {
            console.error('Error racha:', err)
            return null
        }
    }

    useEffect(() => {
        if (usuario) cargar()
        else { setRacha(null); rachaRef.current = null }
    }, [usuario])

    // Llamar después de cualquier actividad de lectura
    const refrescarRacha = async () => {
        const antes = rachaRef.current
        const despues = await cargar()
        if (!antes || !despues) return
        const diaNuevo = !antes.hoyCompletado && despues.hoyCompletado
        if (diaNuevo || despues.nuevoProtector) {
            setCelebracion({ ...despues, anterior: antes.racha, diaNuevo })
        }
    }

    return (
        <RachaContext.Provider value={{ racha, refrescarRacha, celebracion, cerrarCelebracion: () => setCelebracion(null) }}>
            {children}
        </RachaContext.Provider>
    )
}

export const useRacha = () => useContext(RachaContext)