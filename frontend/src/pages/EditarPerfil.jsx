import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { X } from '@phosphor-icons/react'
import { useAvisos } from '../context/AvisosContext'

export default function EditarPerfil() {
    const { avisarCarga } = useAvisos()
    const { usuario, login } = useAuth()
    const navigate = useNavigate()
    const [nombre, setNombre] = useState('')
    const [biografia, setBiografia] = useState('')
    const [avatar, setAvatar] = useState('')
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')

    const cargarPerfil = useCallback(async () => {
        try { const res = await api.get(`/usuarios/${usuario.id}`); setNombre(res.data.nombre || ''); setBiografia(res.data.biografia || ''); setAvatar(res.data.avatar || '') }
        catch (err) { console.error('Error:', err); avisarCarga(err, 'No se ha podido cargar tu perfil para editarlo.') }
    }, [avisarCarga, usuario])

    useEffect(() => { cargarPerfil() }, [cargarPerfil])

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setExito('')
        if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
        try {
            const res = await api.put(`/usuarios/${usuario.id}`, { nombre, biografia, avatar })
            login({ token: localStorage.getItem('token'), idusuario: usuario.id, nombre: res.data.nombre, email: usuario.email, rol: usuario.rol })
            setExito('Perfil actualizado')
        } catch (err) { setError(err.response?.data?.mensaje || 'Error al actualizar') }
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="flex items-start justify-between mb-8">
                <h1 className="font-serif text-4xl leading-none tracking-tight text-texto">Editar perfil</h1>
                <button onClick={() => navigate('/perfil')} className="text-texto-sec hover:text-texto" aria-label="Cerrar"><X size={22} /></button>
            </div>
            {error && <p className="text-error text-sm mb-4">{error}</p>}
            {exito && <p className="text-exito text-sm mb-4">{exito}</p>}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="etiqueta block mb-2">Nombre</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="campo" required />
                </div>
                <div>
                    <label className="etiqueta block mb-2">Biografía</label>
                    <textarea value={biografia} onChange={(e) => setBiografia(e.target.value)} rows={3}
                              className="campo resize-none" placeholder="Qué lees, qué buscas, qué no soportas…" />
                </div>
                <div>
                    <label className="etiqueta block mb-2">Foto (URL)</label>
                    <div className="flex items-center gap-4">
                        <input type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} className="campo" placeholder="https://ejemplo.com/foto.jpg" />
                        {avatar && <img src={avatar} alt="Vista previa" className="w-12 h-12 rounded-full object-cover border border-linea flex-shrink-0" />}
                    </div>
                </div>
                <button type="submit" className="btn-acento w-full">Guardar cambios</button>
            </form>
        </div>
    )
}
