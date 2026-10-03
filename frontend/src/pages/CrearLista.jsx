import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { X } from '@phosphor-icons/react'
import { useAvisos } from '../context/AvisosContext'

export default function CrearLista() {
    const { avisarCarga } = useAvisos()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const volver = searchParams.get('volver')
    const idlista = searchParams.get('editar')
    const esEdicion = !!idlista

    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [esPublica, setEsPublica] = useState(true)
    const [error, setError] = useState('')

    const cargarLista = useCallback(async () => {
        try {
            const res = await api.get(`/listas/${idlista}`)
            const lista = res.data
            setNombre(lista.nombre || '')
            setDescripcion(lista.descripcion || '')
            setEsPublica(lista.esPublica)
        } catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar la lista para editarla.') }
    }, [avisarCarga, idlista])

    useEffect(() => {
        if (esEdicion) cargarLista()
    }, [cargarLista, esEdicion, idlista])

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('')
        if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
        try {
            if (esEdicion) {
                await api.put(`/listas/${idlista}`, { nombre, descripcion, esPublica })
                navigate(volver || `/lista/${idlista}`)
            } else {
                await api.post(`/listas/usuario/${usuario.id}`, { nombre, descripcion, esPublica })
                navigate(volver || '/listas')
            }
        } catch (err) { setError(err.response?.data?.mensaje || (esEdicion ? 'Error al actualizar' : 'Error al crear la lista')) }
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-serif text-4xl leading-none text-texto">{esEdicion ? 'Editar lista' : 'Nueva lista'}</h1>
                <button onClick={() => navigate(-1)} className="text-texto-sec hover:text-texto" aria-label="Cerrar"><X size={22} /></button>
            </div>
            {error && <p className="text-error text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="etiqueta block mb-2">Nombre</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                           className="campo" placeholder="Ej: Favoritos de fantasía" required />
                </div>
                <div>
                    <label className="etiqueta block mb-2">Descripción</label>
                    <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3}
                              className="campo" placeholder="Descripción opcional…" />
                </div>
                <label className="flex items-center gap-2 text-texto-sec text-sm cursor-pointer">
                    <input type="checkbox" checked={esPublica} onChange={(e) => setEsPublica(e.target.checked)} className="accent-acento" />Lista pública
                </label>
                <button type="submit" className="w-full btn-acento">
                    {esEdicion ? 'Guardar cambios' : 'Crear lista'}
                </button>
            </form>
        </div>
    )
}