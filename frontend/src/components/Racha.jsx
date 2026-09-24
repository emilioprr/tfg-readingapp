import { useState, useEffect } from 'react'
import { useRacha } from '../context/RachaContext.jsx'

const HITOS = [7, 30, 100, 365]

export const colorLlama = (n) =>
    n >= 100 ? '#a855f7' : n >= 30 ? '#ef4444' : n >= 1 ? '#f97316' : '#5a5a5a'

export function Llama({ n = 0, className = 'w-5 h-5' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={colorLlama(n)} className={className}>
            <path fillRule="evenodd" clipRule="evenodd"
                  d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" />
        </svg>
    )
}

export function SemanaRacha({ semana = [], animarHoy = false }) {
    const estilo = {
        LEIDO: 'bg-orange-500',
        PROTEGIDO: 'bg-sky-500/80',
        PENDIENTE: 'border-2 border-orange-500',
        VACIO: 'bg-dark-border',
        FUTURO: 'border border-dark-border',
    }
    return (
        <div className="flex justify-between gap-2">
            {semana.map((d) => (
                <div key={d.fecha} className="flex flex-col items-center gap-1">
                    <span className={`text-xs ${d.esHoy ? 'text-dark-text font-semibold' : 'text-dark-muted'}`}>{d.letra}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${estilo[d.estado]} ${
                        animarHoy && d.esHoy && d.estado === 'LEIDO' ? 'animate-pop' : ''}`}>
                        {d.estado === 'PROTEGIDO' && '🛡'}
                    </div>
                </div>
            ))}
        </div>
    )
}

/** Icono de la barra de navegación, con la semana al pasar el ratón */
export function RachaNavbar() {
    const { racha } = useRacha() || {}
    if (!racha) return null
    const n = racha.racha

    return (
        <div className="relative group flex items-center gap-1 cursor-default">
            <Llama n={n} className="w-5 h-5" />
            <span className="font-bold text-sm" style={{ color: colorLlama(n) }}>{n}</span>

            <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50">
                <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-2xl w-64">
                    <p className="text-dark-text text-sm font-semibold">{n} {n === 1 ? 'día' : 'días'} de racha</p>
                    <p className="text-dark-muted text-xs mb-3">
                        {racha.hoyCompletado ? '¡Hoy ya has leído!' : 'Lee hoy para mantener tu racha'}
                    </p>
                    <SemanaRacha semana={racha.semana} />
                    <div className="flex justify-between text-xs text-dark-muted mt-3">
                        <span>Mejor racha: {racha.mejorRacha}</span>
                        <span>🛡 {racha.protectores}/2</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

/** Tarjeta compacta para el inicio */
export function RachaTarjeta() {
    const { racha } = useRacha() || {}
    if (!racha) return null
    const n = racha.racha

    return (
        <div className="bg-dark-card rounded-2xl px-5 py-4 flex items-center gap-5">
            <div className="flex flex-col items-center">
                <Llama n={n} className="w-8 h-8" />
                <span className="font-bold text-lg leading-none mt-1" style={{ color: colorLlama(n) }}>{n}</span>
            </div>
            <div>
                <SemanaRacha semana={racha.semana} />
                <p className="text-dark-muted text-xs mt-2">
                    {racha.hoyCompletado ? '¡Hoy ya has leído!' : 'Lee hoy para mantener tu racha'} · 🛡 {racha.protectores}/2
                </p>
            </div>
        </div>
    )
}

/** Celebración global al sumar un día (se monta una vez en MainLayout) */
export function RachaCelebracion() {
    const { celebracion, cerrarCelebracion } = useRacha() || {}
    const [numero, setNumero] = useState(0)

    useEffect(() => {
        if (!celebracion) return
        setNumero(celebracion.diaNuevo ? celebracion.anterior : celebracion.racha)
        const t1 = setTimeout(() => setNumero(celebracion.racha), 600)
        const t2 = setTimeout(cerrarCelebracion, 4500)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [celebracion])

    if (!celebracion) return null
    const n = celebracion.racha
    const esHito = celebracion.diaNuevo && HITOS.includes(n)

    return (
        <div className="fixed top-6 left-0 right-0 z-[60] flex justify-center pointer-events-none">
            <div onClick={cerrarCelebracion}
                 className="animate-racha-in pointer-events-auto cursor-pointer bg-dark-card border border-orange-500/40 rounded-2xl px-8 py-5 shadow-2xl text-center w-72">
                <Llama n={n} className="w-12 h-12 mx-auto animate-llama" />
                <p key={numero} className="text-4xl font-bold animate-pop" style={{ color: colorLlama(n) }}>{numero}</p>
                <p className="text-dark-text font-semibold mb-4">
                    {esHito ? `¡Hito de ${n} días! 🏅` : celebracion.diaNuevo ? `¡Racha de ${n} ${n === 1 ? 'día' : 'días'}!` : '¡Sigue así!'}
                </p>
                <SemanaRacha semana={celebracion.semana} animarHoy />
                {celebracion.nuevoProtector && (
                    <p className="text-sky-400 text-sm mt-4">🛡 ¡Has ganado un protector de racha!</p>
                )}
            </div>
        </div>
    )
}