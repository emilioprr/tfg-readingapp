import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function ListaCard({ lista }) {
    const [libros, setLibros] = useState([])

    useEffect(() => {
        cargarLibros()
    }, [lista.idlista])

    const cargarLibros = async () => {
        try {
            const res = await api.get(`/listas/${lista.idlista}`)
            setLibros((res.data.libros || []).slice(0, 4))
        } catch (err) { console.error('Error:', err) }
    }

    return (
        <Link to={`/lista/${lista.idlista}`}
              className="bg-dark-card rounded-xl overflow-hidden hover:bg-dark-elevated transition-colors group block p-5">
            {/* Portadas + avatar */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex gap-1.5">
                    {libros.length > 0 ? (
                        libros.map((libro) => (
                            <div key={libro.idlibro} className="w-20 h-28 overflow-hidden rounded-sm">
                                {libro.portada ? (
                                    <img src={libro.portada} alt={libro.titulo}
                                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                ) : (
                                    <div className="w-full h-full bg-dark-elevated flex items-center justify-center text-dark-muted text-xs">
                                        📖
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="w-20 h-28 bg-dark-elevated rounded-sm flex items-center justify-center">
                            <span className="text-dark-muted text-xs">Vacía</span>
                        </div>
                    )}
                </div>

                {lista.nombreUsuario && (
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {lista.avatarUsuario ? (
                            <img src={lista.avatarUsuario} alt={lista.nombreUsuario}
                                 className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                            <div className="w-6 h-6 bg-terra/20 rounded-full flex items-center justify-center text-terra text-xs font-bold">
                                {lista.nombreUsuario.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="text-dark-muted text-xs">{lista.nombreUsuario}</span>
                    </div>
                )}
            </div>

            {/* Título */}
            <p className="text-terra font-semibold group-hover:text-terra-hover transition-colors">{lista.nombre}</p>

            {/* Descripción */}
            {lista.descripcion && (
                <p className="text-dark-muted text-sm mt-1 line-clamp-2">{lista.descripcion}</p>
            )}

            {/* Contador */}
            <p className="text-dark-muted text-xs mt-2">{libros.length} libros</p>
        </Link>
    )
}