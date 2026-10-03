import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { mejorarPortada } from '../utils/portadas'
import PortadaGenerada from '../components/PortadaGenerada'
import { useAvisos } from '../context/AvisosContext'

export default function Calendario() {
    const { avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const [mes, setMes] = useState(new Date().getMonth())
    const [anio, setAnio] = useState(new Date().getFullYear())
    const [seguimientos, setSeguimientos] = useState([])
    const [loading, setLoading] = useState(true)

    const cargarSeguimientos = useCallback(async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}`)
            setSeguimientos(res.data || [])
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar tu calendario de lectura.') }
        finally { setLoading(false) }
    }, [avisarCarga, usuario])

    useEffect(() => {
        if (usuario) cargarSeguimientos()
    }, [cargarSeguimientos, usuario])

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const diasEnMes = new Date(anio, mes + 1, 0).getDate()

    const getOffset = () => {
        let d = new Date(anio, mes, 1).getDay()
        return d === 0 ? 6 : d - 1
    }

    const getLibrosDelDia = (dia) => {
        const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
        // Solo días de lectura de verdad: avanzar páginas o terminar un libro (como la racha).
        // Añadir a "Quiero leer", empezar en la página 0 o marcarlo como leído hace tiempo no es leer ese día.
        const segsDelDia = seguimientos.filter(s => s.fecha === fecha && (
            (s.estado === 'LEYENDO' && s.numPagina > 0) || (s.estado === 'LEIDO' && !s.lecturaAntigua)))
        const vistos = new Set()
        return segsDelDia.filter(s => {
            if (vistos.has(s.idlibro)) return false
            vistos.add(s.idlibro)
            return true
        })
    }

    const aniosDisponibles = []
    for (let a = 2024; a <= new Date().getFullYear(); a++) aniosDisponibles.push(a)

    if (loading) return <p className="text-texto-sec">Cargando…</p>

    return (
        <div className="max-w-6xl mx-auto">
            {/* Cabecera con selectores */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <p className="etiqueta mb-2">Tu calendario de lectura</p>
                    <h1 className="font-serif text-4xl sm:text-5xl leading-none text-texto">{meses[mes]} <span className="text-texto-ter">{anio}</span></h1>
                </div>
                <div className="flex items-center gap-3">
                    <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))}
                            className="campo w-auto" aria-label="Mes">
                        {meses.map((nombre, i) => (
                            <option key={i} value={i}>{nombre}</option>
                        ))}
                    </select>
                    <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))}
                            className="campo w-auto" aria-label="Año">
                        {aniosDisponibles.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Cabeceras días de la semana */}
            <div className="grid grid-cols-7 gap-3 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                    <div key={d} className="text-center text-xs text-texto-sec font-medium py-1">{d}</div>
                ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-3">
                {/* Espacios vacíos antes del día 1 */}
                {Array.from({ length: getOffset() }, (_, i) => (
                    <div key={`pad-${i}`} className="aspect-square" />
                ))}

                {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((dia) => {
                    const libros = getLibrosDelDia(dia)
                    const hoy = new Date()
                    const esHoy = hoy.getFullYear() === anio && hoy.getMonth() === mes && hoy.getDate() === dia

                    return (
                        <div key={dia} className={`aspect-square rounded-[2px] overflow-hidden relative group ${esHoy ? 'ring-1 ring-acento ring-offset-2 ring-offset-fondo' : ''}`}>
                            {libros.length > 0 ? (
                                <div className="w-full h-full relative">
                                    {libros.length === 1 ? (
                                        <Link to={`/libro/${libros[0].idlibro}`} className="block w-full h-full">
                                            {libros[0].portadaLibro ? (
                                                <img src={mejorarPortada(libros[0].portadaLibro)} alt={libros[0].tituloLibro}
                                                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                            ) : (
                                                <PortadaGenerada id={libros[0].idlibro} titulo={libros[0].tituloLibro} className="w-full h-full rounded-none" />
                                            )}
                                        </Link>
                                    ) : (
                                        <div className={`w-full h-full grid ${
                                            libros.length === 2 ? 'grid-cols-2' :
                                                libros.length === 3 ? 'grid-cols-2 grid-rows-2' :
                                                    'grid-cols-2 grid-rows-2'
                                        } gap-0.5`}>
                                            {libros.slice(0, 4).map((libro, idx) => (
                                                <Link key={libro.idlibro} to={`/libro/${libro.idlibro}`}
                                                      className={`overflow-hidden ${libros.length === 3 && idx === 2 ? 'col-span-2' : ''}`}>
                                                    {libro.portadaLibro ? (
                                                        <img src={mejorarPortada(libro.portadaLibro)} alt={libro.tituloLibro}
                                                             className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
                                                    ) : (
                                                        <PortadaGenerada id={libro.idlibro} titulo={libro.tituloLibro} className="w-full h-full rounded-none" />
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Número del día */}
                                    <div className="absolute top-1 left-1 bg-fondo/80 text-texto text-[11px] tabular-nums px-1.5 py-0.5 rounded-[2px]">
                                        {dia}
                                    </div>

                                    {/* Indicador de más libros */}
                                    {libros.length > 4 && (
                                        <div className="absolute bottom-1 right-1 bg-fondo/80 text-texto text-[11px] px-1.5 py-0.5 rounded-[2px]">
                                            +{libros.length - 4}
                                        </div>
                                    )}

                                    {/* Tooltip con títulos al hover */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fondo/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {libros.slice(0, 3).map((libro) => (
                                            <p key={libro.idlibro} className="text-texto text-xs truncate">{libro.tituloLibro}</p>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-start justify-start p-1.5 border border-linea/70">
                                    <span className={`text-[11px] tabular-nums ${esHoy ? 'text-acento' : 'text-texto-ter'}`}>{dia}</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-texto-sec">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-linea rounded-[2px]" />
                    <span>Sin actividad</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-4 bg-acento/70 rounded-[1px]" />
                    <span>Día con lectura (la portada de lo que leíste)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-[2px] ring-1 ring-acento" />
                    <span>Hoy</span>
                </div>
            </div>
        </div>
    )
}