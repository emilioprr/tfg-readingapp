import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Calendario() {
    const { usuario } = useAuth()
    const [mes, setMes] = useState(new Date().getMonth())
    const [anio, setAnio] = useState(new Date().getFullYear())
    const [seguimientos, setSeguimientos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (usuario) cargarSeguimientos()
    }, [usuario])

    const cargarSeguimientos = async () => {
        try {
            const res = await api.get(`/seguimientos/usuario/${usuario.id}`)
            setSeguimientos(res.data || [])
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

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
        const segsDelDia = seguimientos.filter(s => s.fecha === fecha)
        const vistos = new Set()
        return segsDelDia.filter(s => {
            if (vistos.has(s.idlibro)) return false
            vistos.add(s.idlibro)
            return true
        })
    }

    const aniosDisponibles = []
    for (let a = 2024; a <= new Date().getFullYear(); a++) aniosDisponibles.push(a)

    if (loading) return <p className="text-dark-muted">Cargando...</p>

    return (
        <div className="max-w-6xl mx-auto">
            {/* Cabecera con selectores */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-dark-text tracking-tight">Calendario de lectura</h1>
                <div className="flex items-center gap-3">
                    <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))}
                            className="bg-dark-elevated border border-dark-border rounded-lg px-3 py-2 text-dark-text text-sm focus:border-terra focus:outline-none transition-colors">
                        {meses.map((nombre, i) => (
                            <option key={i} value={i}>{nombre}</option>
                        ))}
                    </select>
                    <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))}
                            className="bg-dark-elevated border border-dark-border rounded-lg px-3 py-2 text-dark-text text-sm focus:border-terra focus:outline-none transition-colors">
                        {aniosDisponibles.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Cabeceras días de la semana */}
            <div className="grid grid-cols-7 gap-3 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                    <div key={d} className="text-center text-xs text-dark-muted font-medium py-1">{d}</div>
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
                        <div key={dia} className={`aspect-square rounded-xl overflow-hidden relative group ${
                            esHoy ? 'ring-2 ring-terra' : ''
                        }`}>
                            {libros.length > 0 ? (
                                <div className="w-full h-full relative">
                                    {libros.length === 1 ? (
                                        <Link to={`/libro/${libros[0].idlibro}`} className="block w-full h-full">
                                            {libros[0].portadaLibro ? (
                                                <img src={libros[0].portadaLibro} alt={libros[0].tituloLibro}
                                                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                            ) : (
                                                <div className="w-full h-full bg-terra/20 flex items-center justify-center text-terra text-xs font-medium">
                                                    {libros[0].tituloLibro?.substring(0, 10)}
                                                </div>
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
                                                        <img src={libro.portadaLibro} alt={libro.tituloLibro}
                                                             className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
                                                    ) : (
                                                        <div className="w-full h-full bg-terra/20 flex items-center justify-center text-terra text-xs">
                                                            📖
                                                        </div>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Número del día */}
                                    <div className="absolute top-1 left-1.5 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                        {dia}
                                    </div>

                                    {/* Indicador de más libros */}
                                    {libros.length > 4 && (
                                        <div className="absolute bottom-1 right-1.5 bg-terra text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                            +{libros.length - 4}
                                        </div>
                                    )}

                                    {/* Tooltip con títulos al hover */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {libros.slice(0, 3).map((libro) => (
                                            <p key={libro.idlibro} className="text-white text-xs truncate">{libro.tituloLibro}</p>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${
                                    esHoy ? 'bg-terra/10' : 'bg-dark-card'
                                }`}>
                                    <span className={`text-sm ${esHoy ? 'text-terra font-bold' : 'text-dark-muted/40'}`}>{dia}</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center justify-center gap-6 mt-8 text-xs text-dark-muted">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-dark-card rounded" />
                    <span>Sin actividad</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-terra/30 rounded" />
                    <span>Día con lectura</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded ring-2 ring-terra" />
                    <span>Hoy</span>
                </div>
            </div>
        </div>
    )
}