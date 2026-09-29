import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import api from '../api/axios'

const RachaContext = createContext(null)

export function RachaProvider({ children }) {
    const { usuario } = useAuth()
    const [racha, setRacha] = useState(null)
    const [celebracion, setCelebracion] = useState(null)
    const rachaRef = useRef(null)

    const cargar = useCallback(async () => {
        if (!usuario) return null
        try {
            const res = await api.post(`/racha/usuario/${usuario.id}/actualizar`)
            rachaRef.current = res.data
            setRacha(res.data)
            return res.data
        } catch (err) {
            console.error('Error racha:', err)
            return null
        }
    }, [usuario])

    useEffect(() => {
        if (usuario) cargar()
        else { setRacha(null); rachaRef.current = null }
    }, [usuario, cargar])

    const cerrarCelebracion = useCallback(() => setCelebracion(null), [])

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
        <RachaContext.Provider value={{ racha, refrescarRacha, celebracion, cerrarCelebracion }}>
            {children}
        </RachaContext.Provider>
    )
}

// El hook vive junto a su Provider (patrón habitual de Context)
// eslint-disable-next-line react-refresh/only-export-components
export const useRacha = () => useContext(RachaContext)