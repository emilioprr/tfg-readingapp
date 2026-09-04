import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/axios'

export default function Catalogo() {
    const [searchParams] = useSearchParams()
    const queryInicial = searchParams.get('q') || ''

    const [resultadosBusqueda, setResultadosBusqueda] = useState([])
    const [buscando, setBuscando] = useState(!!queryInicial)
    const [populares, setPopulares] = useState([])
    const [generos, setGeneros] = useState([])
    const [librosPorGenero, setLibrosPorGenero] = useState({})
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        if (queryInicial) {
            buscar(queryInicial)
        } else {
            setBuscando(false)
            cargarPopulares()
            cargarGeneros()
        }
    }, [queryInicial])

    const buscar = async (texto) => {
        setBuscando(true)
        try {
            const res = await api.get(`/libros/buscar?titulo=${texto}&size=24`)
            setResultadosBusqueda(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error buscando:', err)
        } finally {
            setCargando(false)
        }
    }

    const cargarPopulares = async () => {
        try {
            const res = await api.get('/libros/populares?size=12')
            setPopulares(res.data.content || res.data || [])
        } catch (err) {
            console.error('Error cargando populares:', err)
        }
    }

    const cargarGeneros = async () => {
        try {
            const res = await api.get('/libros/generos')
            const lista = res.data || []
            setGeneros(lista)
            const librosMap = {}
            for (const genero of lista.slice(0, 10)) {
                try {
                    const gRes = await api.get(`/libros/genero/${genero}?size=12`)
                    librosMap[genero] = gRes.data.content || gRes.data || []
                } catch (err) {
                    console.error(`Error cargando género ${genero}:`, err)
                }
            }
            setLibrosPorGenero(librosMap)
        } catch (err) {
            console.error('Error cargando géneros:', err)
        } finally {
            setCargando(false)
        }
    }


    const LibroCard = ({ libro }) => (
        <Link to={`/libro/${libro.idlibro}`} className="group flex-shrink-0 w-36">
            <div className="bg-dark-card rounded-xl overflow-hidden hover:bg-dark-elevated transition-colors relative">
                {libro.portada ? (
                    <img src={libro.portada} alt={libro.titulo} className="w-full h-48 object-cover" />
                ) : (
                    <div className="w-full h-48 bg-dark-elevated flex items-center justify-center text-dark-muted text-sm">Sin portada</div>
                )}
                <div className="p-2">
                    <p className="text-sm text-dark-text truncate group-hover:text-terra transition-colors">{libro.titulo}</p>
                    <p className="text-xs text-dark-muted truncate">{libro.nombreAutor}</p>
                </div>
            </div>
        </Link>
    )

    return (
        <div>
            <h1 className="text-2xl font-bold text-dark-text mb-8 tracking-tight">Libros</h1>
            {buscando ? (
                <div>
                    <h2 className="text-lg font-semibold text-dark-muted mb-4">Resultados para "{queryInicial}"</h2>
                    {resultadosBusqueda.length === 0 && !cargando ? (
                        <p className="text-dark-muted">No se encontraron libros</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {resultadosBusqueda.map((libro) => <LibroCard key={libro.idlibro} libro={libro} />)}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {populares.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-lg font-semibold text-dark-text mb-4">Populares</h2>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {populares.map((libro) => <LibroCard key={libro.idlibro} libro={libro} />)}
                            </div>
                        </div>
                    )}
                    {cargando ? <p className="text-dark-muted">Cargando catálogo...</p> : (
                        generos.slice(0, 10).map((genero) => {
                            const libros = librosPorGenero[genero] || []
                            if (libros.length === 0) return null
                            return (
                                <div key={genero} className="mb-10">
                                    <h2 className="text-lg font-semibold text-dark-text mb-4 capitalize">{genero}</h2>
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        {libros.map((libro) => <LibroCard key={libro.idlibro} libro={libro} />)}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </>
            )}
        </div>
    )
}