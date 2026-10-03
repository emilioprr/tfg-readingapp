import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { Heart } from '@phosphor-icons/react'
import Portada from './Portada'

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

    const total = lista.numLibros ?? libros.length

    return (
        <Link to={`/lista/${lista.idlista}`} className="group flex flex-col sm:flex-row sm:items-center gap-5 py-6 border-b border-linea">
            {/* Las primeras portadas, solapadas como una pila de libros */}
            <div className="flex flex-shrink-0 pl-1">
                {libros.length > 0 ? (
                    libros.map((libro, i) => (
                        <div key={libro.idlibro} className={i > 0 ? '-ml-7' : ''} style={{ zIndex: libros.length - i }}>
                            <Portada src={libro.portada} titulo={libro.titulo} id={libro.idlibro} elevar={false}
                                     className="w-16 shadow-[4px_0_10px_-2px_rgb(16_15_13/0.7)]" />
                        </div>
                    ))
                ) : (
                    <div className="w-16 aspect-[2/3] border border-dashed border-linea rounded-[2px] flex items-center justify-center">
                        <span className="text-texto-ter text-[11px]">Vacía</span>
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-serif text-xl leading-snug text-texto group-hover:text-acento">{lista.nombre}</p>
                {lista.descripcion && (
                    <p className="text-texto-sec text-sm mt-1 line-clamp-2">{lista.descripcion}</p>
                )}
                <p className="text-texto-ter text-xs mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {lista.nombreUsuario && <span>de <span className="text-texto-sec">{lista.nombreUsuario}</span></span>}
                    <span>{total} {total === 1 ? 'libro' : 'libros'}</span>
                    {lista.numLikes > 0 && (
                        <span className={`flex items-center gap-1 ${lista.likeada ? 'text-acento' : ''}`} title={`${lista.numLikes} me gusta`}>
                            <Heart size={12} weight="fill" /> {lista.numLikes}
                        </span>
                    )}
                </p>
            </div>
        </Link>
    )
}
