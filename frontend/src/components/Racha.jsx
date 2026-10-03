import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, Fire } from '@phosphor-icons/react'
import { useRacha } from '../context/RachaContext.jsx'

const HITOS = [7, 30, 100, 365]

// === Números en letras (para "Ocho días seguidos leyendo") ===
const UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
    'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
    'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

/** Número en letras hasta 999; a partir de ahí, en cifras. "Un día" / "Veintiún días" concuerdan con "día". */
function enLetras(n) {
    if (n >= 1000) return n.toLocaleString('es-ES')
    if (n === 100) return 'cien'
    const c = Math.floor(n / 100), resto = n % 100
    let texto
    if (resto < 30) texto = UNIDADES[resto]
    else texto = DECENAS[Math.floor(resto / 10)] + (resto % 10 ? ' y ' + UNIDADES[resto % 10] : '')
    if (c > 0) texto = CENTENAS[c] + (resto ? ' ' + texto : '')
    // Delante de "día(s)": uno -> un, veintiuno -> veintiún
    return texto.replace(/veintiuno$/, 'veintiún').replace(/(^| )uno$/, '$1un')
}
const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1)

/** "Ocho días seguidos leyendo"; con uno, "Primer día de racha". */
const diasSeguidos = (n) => n === 1 ? 'Primer día de racha' : `${mayuscula(enLetras(n))} días seguidos leyendo`

/** Icono de la racha: una llama de trazo fino (en acento si hay racha, apagada si no). */
export function IconoRacha({ activa = true, size = 18 }) {
    return <Fire aria-hidden size={size} weight={activa ? 'fill' : 'regular'} className={activa ? 'text-acento' : 'text-texto-ter'} />
}

/** Sello tipográfico, como un ex libris: el número dentro de un círculo fino. */
export function Sello({ numero, etiqueta = 'días', className = 'w-20 h-20' }) {
    return (
        <div className={`rounded-full border border-acento/70 flex flex-col items-center justify-center text-acento ${className}`}
             role="img" aria-label={`${numero} ${etiqueta}`}>
            <span className="font-serif text-2xl leading-none">{numero}</span>
            <span className="text-[9px] uppercase tracking-[0.18em] mt-1">{etiqueta}</span>
        </div>
    )
}

/** La semana: siete marcas finas. Leído relleno en acento, protegido y hoy pendiente con contorno acento. */
export function SemanaRacha({ semana = [] }) {
    const estilo = {
        LEIDO: 'bg-acento',
        PROTEGIDO: 'border border-acento',
        PENDIENTE: 'border border-acento',
        VACIO: 'bg-linea',
        FUTURO: 'border border-linea',
    }
    const titulo = { LEIDO: 'Leído', PROTEGIDO: 'Protegido', PENDIENTE: 'Pendiente hoy', VACIO: 'Sin lectura', FUTURO: 'Todavía no' }
    return (
        <div className="flex justify-between gap-2">
            {semana.map((d) => (
                <div key={d.fecha} className="flex flex-col items-center gap-1.5" title={titulo[d.estado]}>
                    <span className={`text-[11px] ${d.esHoy ? 'text-texto' : 'text-texto-ter'}`}>{d.letra}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${estilo[d.estado]}`} />
                </div>
            ))}
        </div>
    )
}

/** Racha compacta de la barra de navegación, con la semana al pasar el ratón */
export function RachaNavbar() {
    const { racha } = useRacha() || {}
    if (!racha) return null
    const n = racha.racha

    return (
        <div className="relative group flex items-center gap-1.5 cursor-default" tabIndex={0}
             aria-label={`${n} ${n === 1 ? 'día' : 'días'} de racha`}>
            <IconoRacha activa={n > 0} />
            <span className={`font-serif text-lg leading-none ${n > 0 ? 'text-acento' : 'text-texto-ter'}`}>{n}</span>

            <div className="absolute right-0 top-full pt-3 hidden group-hover:block group-focus-within:block z-50">
                <div className="bg-superficie border border-linea rounded p-4 w-64">
                    <p className="font-serif text-xl text-texto leading-tight">
                        {n === 0 ? 'Hoy empieza una racha nueva' : diasSeguidos(n)}
                    </p>
                    <p className="text-texto-sec text-xs mt-1 mb-4">
                        {racha.hoyCompletado ? 'Hoy ya has leído.' : 'Lee hoy para no perderla.'}
                    </p>
                    <SemanaRacha semana={racha.semana} />
                    <div className="flex justify-between text-xs text-texto-sec mt-4 pt-3 border-t border-linea">
                        <span>Mejor racha: <span className="text-texto">{racha.mejorRacha}</span></span>
                        <span className="flex items-center gap-1" title="Protectores de racha">
                            <ShieldCheck size={14} className="text-acento" /> {racha.protectores} de 2
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

/** Número que cuenta suavemente desde `desde` hasta `hasta`. */
function useContador(desde, hasta, duracion = 900) {
    const [valor, setValor] = useState(hasta)
    const marco = useRef(0)
    useEffect(() => {
        if (desde === hasta) { setValor(hasta); return }
        const inicio = performance.now()
        const paso = (ahora) => {
            const t = Math.min(1, (ahora - inicio) / duracion)
            const suave = 1 - Math.pow(1 - t, 3) // ease-out, sin rebote
            setValor(Math.round(desde + (hasta - desde) * suave))
            if (t < 1) marco.current = requestAnimationFrame(paso)
        }
        setValor(desde)
        marco.current = requestAnimationFrame(paso)
        return () => cancelAnimationFrame(marco.current)
    }, [desde, hasta, duracion])
    return valor
}

/** Aviso al sumar un día de racha (se monta una vez en MainLayout): una tira sobria con el número contando. */
export function RachaCelebracion() {
    const { celebracion, cerrarCelebracion } = useRacha() || {}
    const n = celebracion?.racha ?? 0
    const desde = celebracion?.diaNuevo ? (celebracion.anterior ?? n) : n
    const numero = useContador(desde, n)

    useEffect(() => {
        if (!celebracion) return
        const t = setTimeout(cerrarCelebracion, 5000)
        return () => clearTimeout(t)
    }, [celebracion, cerrarCelebracion])

    if (!celebracion) return null
    const esHito = celebracion.diaNuevo && HITOS.includes(n)
    const dias = `${n === 1 ? 'día' : 'días'}`
    const frase = esHito
        ? `${mayuscula(enLetras(n))} ${dias} seguidos. Eso ya es costumbre.`
        : celebracion.diaNuevo ? diasSeguidos(n) : 'Sigues en racha. Buen trabajo.'

    return (
        <div className="fixed top-16 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
            <div onClick={cerrarCelebracion} role="status"
                 className="animate-tira pointer-events-auto cursor-pointer bg-superficie border border-linea border-t-2 border-t-acento rounded px-6 py-5 w-full max-w-sm">
                <div className="flex items-center gap-5">
                    {esHito ? (
                        <Sello numero={numero} etiqueta={dias} className="w-20 h-20 flex-shrink-0" />
                    ) : (
                        <span className="font-serif text-6xl leading-none text-acento tabular-nums w-20 text-center flex-shrink-0">{numero}</span>
                    )}
                    <div className="min-w-0">
                        <p className="font-serif text-xl leading-snug text-texto">{frase}</p>
                        {celebracion.nuevoProtector && (
                            <p className="text-texto-sec text-sm mt-2 flex items-center gap-1.5">
                                <ShieldCheck size={16} className="text-acento" /> Has ganado un protector de racha.
                            </p>
                        )}
                    </div>
                </div>
                {celebracion.semana?.length > 0 && <div className="mt-5"><SemanaRacha semana={celebracion.semana} /></div>}
            </div>
        </div>
    )
}
