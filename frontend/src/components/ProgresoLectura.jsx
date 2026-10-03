/**
 * Progreso de lectura: la página actual en números grandes (p. 142 / 380) y una línea fina
 * con el tramo leído en acento.
 */
export default function ProgresoLectura({ pagina = 0, total, porcentaje, grande = true }) {
    const pct = Math.min(100, Math.max(0, porcentaje ?? (total ? Math.round((pagina / total) * 100) : 0)))
    return (
        <div>
            <p className="font-serif leading-none text-texto">
                <span className={grande ? 'text-5xl sm:text-6xl' : 'text-3xl'}>
                    <span className="text-texto-sec text-[0.45em] mr-1 italic">pág.</span>{pagina}
                </span>
                {total ? <span className={`text-texto-ter ${grande ? 'text-2xl sm:text-3xl' : 'text-xl'}`}> / {total}</span> : null}
                <span className="font-sans text-xs text-texto-ter ml-3 align-middle">{pct}%</span>
            </p>
            <div className="relative mt-5 h-[2px] bg-linea" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
                 aria-label={`Página ${pagina}${total ? ` de ${total}` : ''}`}>
                <div className="absolute inset-y-0 left-0 bg-acento transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}
