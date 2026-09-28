import { useState } from 'react'

/**
 * Tapa un contenido con spoilers: se ve difuminado con un aviso encima y un botón para mostrarlo.
 * Si `activo` es false (no hay spoiler, o es contenido propio) muestra el contenido tal cual.
 */
export default function SpoilerOculto({ activo, children }) {
    const [revelado, setRevelado] = useState(false)

    if (!activo || revelado) return children

    const revelar = (e) => {
        e.stopPropagation() // las tarjetas de reseña navegan al pulsarlas
        setRevelado(true)
    }

    return (
        <div className="relative mt-2 rounded-lg overflow-hidden">
            <div aria-hidden className="blur-md select-none pointer-events-none min-h-[4.5rem] [&>*]:mt-0">
                {children}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dark-base/40 text-center px-3">
                <p className="text-dark-text text-sm font-medium flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Contiene spoilers
                </p>
                <button onClick={revelar}
                        className="text-xs font-semibold text-terra hover:text-terra-hover border border-terra/40 hover:border-terra rounded-full px-3 py-1 transition-colors">
                    Ver de todos modos
                </button>
            </div>
        </div>
    )
}
