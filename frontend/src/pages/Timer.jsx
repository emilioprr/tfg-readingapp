import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Timer() {
    const { usuario } = useAuth()

    const [leyendo, setLeyendo] = useState([])
    const [libroSeleccionado, setLibroSeleccionado] = useState(null)

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

    const intervalRef = useRef(null)
    const segundosRef = useRef(0)

    useEffect(() => {
        if (usuario) cargarLeyendo()
    }, [usuario])

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

    const cargarLeyendo = async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}/estado/LEYENDO`)
            const datos = res.data || []
            datos.sort((a, b) => b.idseguimiento - a.idseguimiento)
            setLeyendo(datos)
        } catch (err) { console.error('Error:', err) }
    }

    const getTotalMinutosObjetivo = () => {
        return unidadTiempo === 'horas' ? objetivoMinutos * 60 : objetivoMinutos
    }

    const iniciar = () => {
        if (!libroSeleccionado) return
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
                    setActivo(false)
                    setSesionTerminada(true)
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

    const terminar = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setActivo(false)
        setPausado(false)
        setSesionTerminada(true)
    }

    const guardarSesion = async () => {
        const minutosLeidos = modo === 'objetivo'
            ? getTotalMinutosObjetivo() - Math.ceil(segundos / 60)
            : Math.floor(segundosRef.current / 60)

        if (minutosLeidos < 1) {
            alert('La sesión debe durar al menos 1 minuto')
            return
        }

        setGuardando(true)
        try {
            await api.post('/sesiones-lectura', {
                idusuario: usuario.id,
                idlibro: libroSeleccionado.idlibro,
                duracionMinutos: minutosLeidos,
            })
            setGuardado(true)
        } catch (err) {
            alert(err.response?.data?.mensaje || 'Error al guardar')
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

    const getMinutosLeidos = () => {
        return modo === 'objetivo'
            ? getTotalMinutosObjetivo() - Math.ceil(segundos / 60)
            : Math.floor(segundosRef.current / 60)
    }

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold text-dark-text tracking-tight mb-8 text-center">Sesión de lectura</h1>

            {!activo && !sesionTerminada && (
                <div className="space-y-6">
                    {/* Selección de libro */}
                    <div className="bg-dark-card rounded-2xl p-6">
                        <h3 className="text-sm font-medium text-dark-muted mb-3">¿Qué vas a leer?</h3>
                        {leyendo.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-dark-muted text-sm mb-2">No estás leyendo ningún libro</p>
                                <Link to="/catalogo" className="text-terra hover:text-terra-hover text-sm transition-colors">Explorar libros</Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {leyendo.map((s) => (
                                    <button key={s.idlibro} onClick={() => setLibroSeleccionado(s)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                                                libroSeleccionado?.idlibro === s.idlibro
                                                    ? 'bg-terra/20 border border-terra/40'
                                                    : 'bg-dark-elevated hover:bg-dark-border'
                                            }`}>
                                        {s.portadaLibro ? (
                                            <img src={s.portadaLibro} alt={s.tituloLibro} className="w-10 h-14 object-cover rounded-sm" />
                                        ) : (
                                            <div className="w-10 h-14 bg-dark-card rounded-sm flex items-center justify-center text-dark-muted text-xs">📖</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-dark-text text-sm font-medium truncate">{s.tituloLibro}</p>
                                            <p className="text-dark-muted text-xs">{s.porcentaje || 0}% completado</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Modo del timer */}
                    <div className="bg-dark-card rounded-2xl p-6">
                        <h3 className="text-sm font-medium text-dark-muted mb-3">Modo</h3>
                        <div className="flex gap-3 mb-4">
                            <button onClick={() => setModo('libre')}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                        modo === 'libre' ? 'bg-terra text-white' : 'bg-dark-elevated text-dark-muted hover:text-dark-text'
                                    }`}>
                                Contador libre
                            </button>
                            <button onClick={() => setModo('objetivo')}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                        modo === 'objetivo' ? 'bg-terra text-white' : 'bg-dark-elevated text-dark-muted hover:text-dark-text'
                                    }`}>
                                Temporizador
                            </button>
                        </div>

                        {modo === 'objetivo' && (
                            <div>
                                <h3 className="text-sm font-medium text-dark-muted mb-3">Duración</h3>
                                <div className="flex items-center gap-3">
                                    <input type="number" value={objetivoMinutos}
                                           onChange={(e) => setObjetivoMinutos(parseInt(e.target.value) || 1)}
                                           min="1" max={unidadTiempo === 'horas' ? 8 : 480}
                                           className="w-20 bg-dark-elevated border border-dark-border rounded-xl px-3 py-2.5 text-dark-text text-center text-lg font-bold focus:border-terra focus:outline-none transition-colors" />
                                    <div className="flex bg-dark-elevated rounded-xl overflow-hidden border border-dark-border">
                                        <button onClick={() => setUnidadTiempo('minutos')}
                                                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                                                    unidadTiempo === 'minutos' ? 'bg-terra text-white' : 'text-dark-muted hover:text-dark-text'
                                                }`}>
                                            Minutos
                                        </button>
                                        <button onClick={() => setUnidadTiempo('horas')}
                                                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                                                    unidadTiempo === 'horas' ? 'bg-terra text-white' : 'text-dark-muted hover:text-dark-text'
                                                }`}>
                                            Horas
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botón iniciar */}
                    <button onClick={iniciar} disabled={!libroSeleccionado}
                            className="w-full bg-terra hover:bg-terra-hover text-white font-semibold py-3 rounded-xl text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        Iniciar sesión
                    </button>
                </div>
            )}

            {/* Timer activo */}
            {(activo || sesionTerminada) && (
                <div className="text-center">
                    {/* Libro seleccionado */}
                    <div className="flex items-center justify-center gap-4 mb-10">
                        {libroSeleccionado.portadaLibro ? (
                            <img src={libroSeleccionado.portadaLibro} alt={libroSeleccionado.tituloLibro}
                                 className="w-14 h-20 object-cover rounded-sm shadow-lg" />
                        ) : (
                            <div className="w-14 h-20 bg-dark-elevated rounded-sm flex items-center justify-center text-dark-muted">📖</div>
                        )}
                        <div className="text-left">
                            <p className="text-dark-text font-medium">{libroSeleccionado.tituloLibro}</p>
                            <p className="text-dark-muted text-sm">{libroSeleccionado.nombreAutor}</p>
                        </div>
                    </div>

                    {/* Reloj circular */}
                    <div className="relative w-64 h-64 mx-auto mb-8">
                        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="90" fill="none" stroke="#2a2a2a" strokeWidth="4" />
                            {modo === 'objetivo' && (
                                <circle cx="100" cy="100" r="90" fill="none" stroke="#c45d3e" strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeDasharray={`${getProgreso() * 5.65} 565`}
                                        className="transition-all duration-1000" />
                            )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-dark-text tracking-wider font-mono">
                {formatTiempo(segundos)}
              </span>
                            {modo === 'objetivo' && !sesionTerminada && (
                                <span className="text-dark-muted text-sm mt-2">restante</span>
                            )}
                            {sesionTerminada && (
                                <span className="text-terra text-sm mt-2 font-medium">Sesión completada</span>
                            )}
                        </div>
                    </div>

                    {/* Aviso de pausa por tab */}
                    {pausadoPorTab && (
                        <div className="bg-terra/10 border border-terra/30 rounded-xl px-4 py-3 mb-6">
                            <p className="text-terra text-sm font-medium">Temporizador en pausa: has salido de la página</p>
                            <p className="text-dark-muted text-xs mt-1">Vuelve a esta pestaña para continuar</p>
                        </div>
                    )}

                    {/* Controles */}
                    {activo && !sesionTerminada && (
                        <div className="flex items-center justify-center gap-4">
                            {pausado ? (
                                <button onClick={reanudar}
                                        className="bg-terra hover:bg-terra-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Reanudar
                                </button>
                            ) : (
                                <button onClick={pausar}
                                        className="bg-dark-elevated hover:bg-dark-border text-dark-text font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                                    </svg>
                                    Pausar
                                </button>
                            )}
                            <button onClick={terminar}
                                    className="bg-terra hover:bg-terra-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                                Terminar
                            </button>
                            <button onClick={resetear}
                                    className="text-dark-muted hover:text-dark-text transition-colors p-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Sesión terminada */}
                    {sesionTerminada && !guardado && (
                        <div className="space-y-4">
                            <div className="bg-dark-card rounded-2xl p-6">
                                <p className="text-dark-text font-medium mb-1">Sesión finalizada</p>
                                <p className="text-dark-muted text-sm">
                                    Has leído durante {getMinutosLeidos()} minutos
                                </p>
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button onClick={guardarSesion} disabled={guardando}
                                        className="bg-terra hover:bg-terra-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50">
                                    {guardando ? 'Guardando...' : 'Guardar sesión'}
                                </button>
                                <button onClick={resetear}
                                        className="bg-dark-elevated hover:bg-dark-border text-dark-text font-semibold px-6 py-3 rounded-xl transition-colors">
                                    Descartar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Guardado exitoso */}
                    {guardado && (
                        <div className="space-y-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-emerald-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-emerald-400 font-medium">Sesión guardada</p>
                                <p className="text-dark-muted text-sm mt-1">Tu progreso se ha actualizado</p>
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button onClick={resetear}
                                        className="bg-terra hover:bg-terra-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                                    Nueva sesión
                                </button>
                                <Link to="/"
                                      className="bg-dark-elevated hover:bg-dark-border text-dark-text font-semibold px-6 py-3 rounded-xl transition-colors">
                                    Volver al inicio
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}