import { useState, useEffect } from 'react'

/**
 * Aviso de carga de una pantalla. Aparece solo si tarda más de un momento,
 * para que en una conexión rápida no haya parpadeo.
 * pantalla: ocupa toda la ventana (rutas fuera del layout, como la landing)
 */
export default function Cargando({ pantalla = false }) {
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 250)
        return () => clearTimeout(t)
    }, [])
    return (
        <div className={`flex items-center justify-center ${pantalla ? 'min-h-screen bg-fondo' : 'py-24'}`} role="status" aria-live="polite">
            {visible && <p className="font-serif text-xl text-texto-sec">Cargando…</p>}
        </div>
    )
}
