import { useEffect } from 'react'

/**
 * Ventana de confirmación, plana: superficie con filete fino sobre el fondo oscurecido.
 * Se cierra con Escape o pulsando fuera.
 */
export default function Dialogo({ titulo, children, acciones, onCerrar }) {
    useEffect(() => {
        const alPulsar = (e) => { if (e.key === 'Escape') onCerrar?.() }
        window.addEventListener('keydown', alPulsar)
        return () => window.removeEventListener('keydown', alPulsar)
    }, [onCerrar])

    return (
        <div className="fixed inset-0 bg-fondo/80 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
            <div role="dialog" aria-modal="true" aria-label={titulo}
                 className="bg-superficie border border-linea rounded p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-serif text-2xl text-texto leading-tight mb-2">{titulo}</h3>
                {children && <div className="text-texto-sec text-sm mb-6">{children}</div>}
                <div className="flex gap-3 justify-end">{acciones}</div>
            </div>
        </div>
    )
}
