import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { X } from '@phosphor-icons/react'
import Dialogo from '../components/Dialogo'

/**
 * Avisos y confirmaciones propios de la app, en lugar de alert() y confirm() del navegador.
 *
 * avisar(texto, tipo?)  → tira breve abajo a la derecha; tipo 'error' (por defecto) o 'info'.
 *                         Si ya hay un aviso igual a la vista, no se repite.
 * avisarCarga(err, texto) → para cuando falla la carga de datos de una pantalla: avisa salvo en un 403 o 404
 *                         (eso ya lo dice la propia pantalla: "no existe o no se ha podido cargar")
 * confirmar({ titulo, texto, aceptar, peligro }) → abre un Dialogo y resuelve true/false
 */
const AvisosContext = createContext(null)

const DURACION = 5000

export function AvisosProvider({ children }) {
    const [avisos, setAvisos] = useState([])
    const [pregunta, setPregunta] = useState(null)
    const siguienteId = useRef(0)

    const quitar = useCallback((id) => setAvisos(prev => prev.filter(a => a.id !== id)), [])

    const avisar = useCallback((texto, tipo = 'error') => {
        const id = ++siguienteId.current
        setAvisos(prev => prev.some(a => a.texto === texto) ? prev : [...prev, { id, texto, tipo }])
        setTimeout(() => quitar(id), DURACION)
    }, [quitar])

    const avisarCarga = useCallback((err, texto) => {
        if ([403, 404].includes(err?.response?.status)) return
        avisar(err?.request && !err.response ? 'No hay conexión con el servidor. Comprueba que está en marcha e inténtalo de nuevo.' : texto)
    }, [avisar])

    const confirmar = useCallback((opciones) => new Promise((resolver) => {
        setPregunta({ ...opciones, resolver })
    }), [])

    const responder = (si) => {
        pregunta?.resolver(si)
        setPregunta(null)
    }

    return (
        <AvisosContext.Provider value={{ avisar, avisarCarga, confirmar }}>
            {children}

            {avisos.length > 0 && (
                <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] flex flex-col gap-3 w-[calc(100%-2rem)] max-w-sm" aria-live="assertive">
                    {avisos.map((a) => (
                        <div key={a.id} role={a.tipo === 'error' ? 'alert' : 'status'}
                             className={`animate-tira bg-superficie border border-linea border-t-2 rounded px-4 py-3 flex items-start gap-3 ${a.tipo === 'error' ? 'border-t-error' : 'border-t-texto'}`}>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-texto leading-snug">{a.texto}</p>
                            </div>
                            <button onClick={() => quitar(a.id)} aria-label="Cerrar aviso" className="text-texto-ter hover:text-texto flex-shrink-0 mt-0.5">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {pregunta && (
                <Dialogo titulo={pregunta.titulo} onCerrar={() => responder(false)}
                         acciones={<>
                             <button onClick={() => responder(false)} className="btn-texto px-2">Cancelar</button>
                             <button onClick={() => responder(true)} autoFocus
                                     className={pregunta.peligro ? 'btn bg-error text-fondo hover:bg-error/85' : 'btn-acento'}>
                                 {pregunta.aceptar || 'Aceptar'}
                             </button>
                         </>}>
                    {pregunta.texto}
                </Dialogo>
            )}
        </AvisosContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAvisos = () => useContext(AvisosContext)
