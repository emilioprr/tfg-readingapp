import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function Catalogo() {
    const [libros, setLibros] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [pagina, setPagina] = useState(0)
    const [hayMas, setHayMas] = useState(true)
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        cargarLibros(0, true)
    }, [])

    const cargarLibros = async (pag, reset = false) => {
        setCargando(true)
        try {
            const size = 12
            const url = busqueda
                ? `/libros/buscar?titulo=${busqueda}&page=${pag}&size=${size}`
                : `/libros?page=${pag}&size=${size}`
            const res = await api.get(url)
            const datos = res.data.content || res.data || []

            if (reset) {
                setLibros(datos)
            } else {
                setLibros(prev => [...prev, ...datos])
            }
            setPagina(pag)
            setHayMas(datos.length === size)
        } catch (err) {
            console.error('Error cargando libros:', err)
        } finally {
            setCargando(false)
        }
    }

    const cargarMas = () => {
        cargarLibros(pagina + 1)
    }

    const handleBuscar = (e) => {
        e.preventDefault()
        setPagina(0)
        setHayMas(true)
        cargarLibros(0, true)
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-amber-400 mb-6">Catálogo</h1>

            <form onSubmit={handleBuscar} className="mb-6 flex gap-2">
                <input
                    type="text"
                    placeholder="Buscar por título..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                />
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold px-4 py-2 rounded">
                    Buscar
                </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {libros.map((libro) => (
                    <Link key={libro.idlibro} to={`/libro/${libro.idlibro}`} className="group">
                        <div className="bg-gray-900 rounded-lg border border-gray-800 hover:border-amber-500/40 overflow-hidden">
                            {libro.portada ? (
                                <img src={libro.portada} alt={libro.titulo} className="w-full h-48 object-cover" />
                            ) : (
                                <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                                    Sin portada
                                </div>
                            )}
                            <div className="p-2">
                                <p className="text-sm text-gray-200 truncate group-hover:text-amber-400">{libro.titulo}</p>
                                <p className="text-xs text-gray-500 truncate">{libro.nombreAutor}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {hayMas && !cargando && (
                <div className="flex justify-center mt-6">
                    <button onClick={cargarMas}
                            className="bg-gray-800 hover:bg-gray-700 text-amber-400 font-medium px-6 py-2 rounded">
                        Cargar más libros
                    </button>
                </div>
            )}

            {cargando && (
                <p className="text-gray-400 text-center mt-6">Cargando...</p>
            )}

            {!hayMas && libros.length > 0 && !cargando && (
                <p className="text-gray-500 text-center mt-6">No hay más libros</p>
            )}

            {libros.length === 0 && !cargando && (
                <p className="text-gray-500 text-center mt-10">No se encontraron libros</p>
            )}
        </div>
    )
}