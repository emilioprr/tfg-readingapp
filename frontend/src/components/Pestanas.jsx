/**
 * Pestañas de la app: texto sencillo; la activa, en texto principal con una línea fina de acento debajo.
 *
 * pestanas: [{ key, label }]  (label puede llevar contadores u otros nodos)
 * desplazable: si no caben (p. ej. el perfil en móvil), se desplazan con el dedo
 */
export default function Pestanas({ pestanas, activa, onCambiar, className = '', desplazable = false, centradas = false }) {
    return (
        <div role="tablist"
             className={`flex gap-1 sm:gap-3 border-b border-linea ${desplazable ? 'overflow-x-auto [scrollbar-width:none]' : ''} ${centradas ? 'sm:justify-center' : ''} ${className}`}>
            {pestanas.map((p) => {
                const esActiva = p.key === activa
                return (
                    <button key={p.key} role="tab" aria-selected={esActiva} onClick={() => onCambiar(p.key)}
                            className={`-mb-px px-3 sm:px-4 py-3 text-sm whitespace-nowrap flex-shrink-0 border-b-2 ${
                                esActiva ? 'text-texto font-medium border-acento' : 'text-texto-sec border-transparent hover:text-texto'}`}>
                        {p.label}
                    </button>
                )
            })}
        </div>
    )
}
