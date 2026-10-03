import { useRef, useState, useLayoutEffect } from 'react'

/**
 * Texto largo recortado a unas líneas, con "Ver más" para desplegarlo en el sitio.
 * El botón solo aparece si el texto realmente no cabe.
 */
export default function TextoDesplegable({ texto, lineas = 6, className = '' }) {
    const ref = useRef(null)
    const [abierto, setAbierto] = useState(false)
    const [recortado, setRecortado] = useState(false)

    useLayoutEffect(() => {
        const medir = () => {
            const el = ref.current
            if (el && !abierto) setRecortado(el.scrollHeight > el.clientHeight + 1)
        }
        medir()
        window.addEventListener('resize', medir)
        return () => window.removeEventListener('resize', medir)
    }, [texto, abierto])

    return (
        <div className={className}>
            <p ref={ref} className="whitespace-pre-line"
               style={abierto ? undefined : { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lineas, overflow: 'hidden' }}>
                {texto}
            </p>
            {(recortado || abierto) && (
                <button onClick={() => setAbierto(!abierto)} aria-expanded={abierto}
                        className="font-sans text-sm text-texto-sec hover:text-texto underline underline-offset-4 decoration-linea hover:decoration-texto-sec mt-3">
                    {abierto ? 'Ver menos' : 'Ver más'}
                </button>
            )}
        </div>
    )
}
