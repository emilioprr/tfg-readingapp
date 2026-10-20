import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRacha } from '../context/RachaContext'
import { useNotificaciones } from '../context/NotificacionesContext'
import api from '../api/axios'
import { Play, Pause, ArrowCounterClockwise, Check } from '@phosphor-icons/react'
import { useAvisos } from '../context/AvisosContext'

export default function Timer() {
    const { avisar } = useAvisos()
    const { usuario } = useAuth()

    const [modo, setModo] = useState('libre')
    const [objetivoMinutos, setObjetivoMinutos] = useState(30)
    const [unidadTiempo, setUnidadTiempo] = useState('minutos')

    const [segundos, setSegundos] = useState(0)
    const [activo, setActivo] = useState(false)
    const [pausado, setPausado] = useState(false)
    const [pausadoPorTab, setPausadoPorTab] = useState(false)
    const [sesionTerminada, setSesionTerminada] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [guardado, setGuardado] = useState(false)
    const { refrescarRacha } = useRacha()
    const { refrescar: refrescarNotificaciones } = useNotificaciones()

    const intervalRef = useRef(null)
    const segundosRef = useRef(0)

    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && activo && !pausado) {
                setPausado(true)
                setPausadoPorTab(true)
                if (intervalRef.current) clearInterval(intervalRef.current)
            }
        }

        const handleBlur = () => {
            if (activo && !pausado) {
                setPausado(true)
                setPausadoPorTab(true)
                if (intervalRef.current) clearInterval(intervalRef.current)
            }
        }

        document.addEventListener('visibilitychange', handleVisibility)
        window.addEventListener('blur', handleBlur)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility)
            window.removeEventListener('blur', handleBlur)
        }
    }, [activo, pausado])

    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [])

    const getTotalMinutosObjetivo = () => {
        return unidadTiempo === 'horas' ? objetivoMinutos * 60 : objetivoMinutos
    }

    const getMinutosLeidos = () => {
        return modo === 'objetivo'
            ? getTotalMinutosObjetivo() - Math.ceil(segundos / 60)
            : Math.floor(segundos / 60)
    }

    const iniciar = () => {
        setActivo(true)
        setPausado(false)
        setPausadoPorTab(false)
        setSesionTerminada(false)
        setGuardado(false)

        if (modo === 'objetivo') {
            const totalSeg = getTotalMinutosObjetivo() * 60
            segundosRef.current = totalSeg
            setSegundos(totalSeg)
        } else {
            segundosRef.current = 0
            setSegundos(0)
        }

        startInterval()
    }

    const startInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => {
            if (modo === 'objetivo') {
                segundosRef.current -= 1
                setSegundos(segundosRef.current)
                if (segundosRef.current <= 0) {
                    clearInterval(intervalRef.current)
                    terminar()
                }
            } else {
                segundosRef.current += 1
                setSegundos(segundosRef.current)
            }
        }, 1000)
    }

    const pausar = () => {
        setPausado(true)
        if (intervalRef.current) clearInterval(intervalRef.current)
    }

    const reanudar = () => {
        setPausado(false)
        setPausadoPorTab(false)
        startInterval()
    }

    const resetear = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setActivo(false)
        setPausado(false)
        setPausadoPorTab(false)
        setSesionTerminada(false)
        setGuardado(false)
        setSegundos(0)
        segundosRef.current = 0
    }

    const terminar = async () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setActivo(false)
        setPausado(false)

        // segundosRef y no el estado: al llegar a cero, terminar() se ejecuta desde el intervalo, que conserva
        // el valor del estado de cuando se arrancó o reanudó
        const minutosLeidos = modo === 'objetivo'
            ? getTotalMinutosObjetivo() - Math.ceil(segundosRef.current / 60)
            : Math.floor(segundosRef.current / 60)

        if (minutosLeidos < 1) {
            setSesionTerminada(true)
            setGuardado(false)
            return
        }

        setGuardando(true)
        try {
            await api.post('/sesiones-lectura', {
                idusuario: usuario.id,
                duracionMinutos: minutosLeidos,
            })
            refrescarRacha()
            refrescarNotificaciones() // por si la sesión completa un reto de horas
            setSesionTerminada(true)
            setGuardado(true)
        } catch (err) {
            avisar(err.response?.data?.mensaje || 'Error al guardar')
            setSesionTerminada(true)
            setGuardado(false)
        } finally {
            setGuardando(false)
        }
    }

    const formatTiempo = (totalSegs) => {
        const h = Math.floor(Math.abs(totalSegs) / 3600)
        const m = Math.floor((Math.abs(totalSegs) % 3600) / 60)
        const s = Math.abs(totalSegs) % 60
        if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    const getProgreso = () => {
        if (modo === 'objetivo') {
            const total = getTotalMinutosObjetivo() * 60
            return ((total - segundos) / total) * 100
        }
        return 0
    }

    // Selector de dos opciones con el mismo aspecto en toda la página
    const opcion = (activa) => `btn flex-1 ${activa ? 'bg-texto text-fondo' : 'border border-linea text-texto-sec hover:text-texto'}`

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="font-serif text-4xl sm:text-5xl leading-none text-texto text-center">Sesión de lectura</h1>
            <p className="text-texto-sec text-sm text-center mt-4 mb-10 max-w-md mx-auto">
                Cronometra el rato que lees. Al terminar se guarda solo y cuenta para tus retos de horas. Si cambias de pestaña, se pausa: así el tiempo es de verdad.
            </p>

            {!activo && !sesionTerminada && (
                <div className="space-y-8">
                    <div className="border-y border-linea py-6 space-y-6">
                        <div>
                            <h3 className="etiqueta mb-3">Modo</h3>
                            <div className="flex gap-3" role="group" aria-label="Modo">
                                <button onClick={() => setModo('libre')} aria-pressed={modo === 'libre'} className={opcion(modo === 'libre')}>
                                    Contador libre
                                </button>
                                <button onClick={() => setModo('objetivo')} aria-pressed={modo === 'objetivo'} className={opcion(modo === 'objetivo')}>
                                    Temporizador
                                </button>
                            </div>
                        </div>

                        {modo === 'objetivo' && (
                            <div>
                                <h3 className="etiqueta mb-3">Duración</h3>
                                <div className="flex items-center gap-3">
                                    <input type="number" value={objetivoMinutos} aria-label="Duración"
                                           onChange={(e) => setObjetivoMinutos(parseInt(e.target.value) || 1)}
                                           min="1" max={unidadTiempo === 'horas' ? 8 : 480}
                                           className="campo w-24 text-center font-serif text-2xl" />
                                    <div className="flex gap-2" role="group" aria-label="Unidad">
                                        <button onClick={() => setUnidadTiempo('minutos')} aria-pressed={unidadTiempo === 'minutos'}
                                                className={opcion(unidadTiempo === 'minutos')}>Minutos</button>
                                        <button onClick={() => setUnidadTiempo('horas')} aria-pressed={unidadTiempo === 'horas'}
                                                className={opcion(unidadTiempo === 'horas')}>Horas</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={iniciar} className="btn-acento w-full py-3 text-base">Empezar a leer</button>
                </div>
            )}

            {(activo || sesionTerminada) && (
                <div className="text-center">
                    <div className="relative w-64 h-64 mx-auto mb-8">
                        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 200 200" aria-hidden>
                            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-linea)" strokeWidth="1.5" />
                            {modo === 'objetivo' && (
                                <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-acento)" strokeWidth="2"
                                        strokeDasharray={`${getProgreso() * 5.65} 565`}
                                        className="transition-all duration-1000" />
                            )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-serif text-6xl text-texto tabular-nums" role="timer" aria-live="off">
                                {formatTiempo(segundos)}
                            </span>
                            {modo === 'objetivo' && activo && !sesionTerminada && (
                                <span className="text-texto-ter text-xs mt-2">por delante</span>
                            )}
                            {guardando && (
                                <span className="text-texto-sec text-sm mt-2">Guardando…</span>
                            )}
                        </div>
                    </div>

                    {pausadoPorTab && (
                        <div className="border-t-2 border-acento bg-superficie px-4 py-3 mb-6 text-left rounded">
                            <p className="text-texto text-sm">En pausa: te has ido de la página.</p>
                            <p className="text-texto-sec text-xs mt-1">Vuelve a esta pestaña para seguir contando.</p>
                        </div>
                    )}

                    {activo && !sesionTerminada && (
                        <div className="flex items-center justify-center gap-3">
                            {pausado ? (
                                <button onClick={reanudar} className="btn-primario px-6 py-3">
                                    <Play size={16} weight="fill" /> Reanudar
                                </button>
                            ) : (
                                <button onClick={pausar} className="btn-secundario px-6 py-3">
                                    <Pause size={16} weight="fill" /> Pausar
                                </button>
                            )}
                            <button onClick={terminar} className="btn-acento px-6 py-3">Terminar</button>
                            <button onClick={resetear} className="text-texto-sec hover:text-texto p-3" aria-label="Empezar de cero" title="Empezar de cero">
                                <ArrowCounterClockwise size={20} />
                            </button>
                        </div>
                    )}

                    {sesionTerminada && (
                        <div className="space-y-6">
                            {guardado ? (
                                <div className="border-y border-linea py-6">
                                    <p className="font-serif text-2xl text-texto">
                                        {getMinutosLeidos()} {getMinutosLeidos() === 1 ? 'minuto' : 'minutos'} de lectura guardados.
                                    </p>
                                    <p className="text-texto-sec text-sm mt-1 flex items-center justify-center gap-1.5">
                                        <Check size={14} className="text-exito" /> Ya cuentan para tus retos y tu racha.
                                    </p>
                                </div>
                            ) : (
                                <div className="border-y border-linea py-6">
                                    <p className="font-serif text-xl text-texto-sec">Ha sido demasiado corta para guardarla. Menos de un minuto no cuenta.</p>
                                </div>
                            )}
                            <div className="flex gap-3 justify-center">
                                <button onClick={resetear} className="btn-acento px-6 py-3">Otra sesión</button>
                                <Link to="/" className="btn-secundario px-6 py-3">Volver al inicio</Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
