import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function ListaCard({ lista }) {
    const [libros, setLibros] = useState([])

    const cargarLibros = useCallback(async () => {
        try {
            const res = await api.get(`/listas/${lista.idlista}`)
            setLibros((res.data.libros || []).slice(0, 4))
        } catch (err) { console.error('Error:', err) }
    }, [lista.idlista])

    useEffect(() => {
        cargarLibros()
    }, [cargarLibros, lista.idlista])

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

            {/* Contadores (el total de libros viene del backend: aquí solo se cargan las 4 primeras portadas) */}
            <p className="text-dark-muted text-xs mt-2 flex items-center gap-3">
                <span>{lista.numLibros ?? libros.length} {(lista.numLibros ?? libros.length) === 1 ? 'libro' : 'libros'}</span>
                {lista.numLikes > 0 && (
                    <span className={`flex items-center gap-1 ${lista.likeada ? 'text-red-500' : ''}`} title={`${lista.numLikes} me gusta`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                        {lista.numLikes}
                    </span>
                )}
            </p>
        </Link>
    )
}