import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { X } from '@phosphor-icons/react'

export default function CrearReto() {
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [titulo, setTitulo] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [tipo, setTipo] = useState('LIBROS')
    const [modalidad, setModalidad] = useState('PERSONAL')
    const [meta, setMeta] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('')
        if (!titulo.trim() || !meta || !fechaFin) { setError('Completa todos los campos'); return }
        try {
            await api.post('/retos', { titulo, descripcion, tipo, modalidad, meta: parseInt(meta), fechaFin, idCreador: usuario.id })
            navigate('/retos')
        } catch (err) {
            setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al crear el reto')
        }
    }

    const tipos = [
        { value: 'LIBROS', label: 'Libros', desc: 'Terminar X libros' },
        { value: 'PAGINAS', label: 'Páginas', desc: 'Leer X páginas' },
        { value: 'HORAS', label: 'Horas', desc: 'Leer X horas' },
    ]

    const modalidades = [
        { value: 'PERSONAL', label: 'Personal', desc: 'Solo para ti' },
        { value: 'COMPARTIDO', label: 'Con amigos', desc: 'Tus amigos pueden unirse' },
        ...(usuario?.rol === 'ADMIN' ? [
            { value: 'PREDEFINIDO', label: 'Oficial', desc: 'Visible para toda la comunidad' },
            { value: 'COLABORATIVO', label: 'Colaborativo', desc: 'Toda la comunidad suma' },
        ] : []),
    ]

    const metaLabel = tipo === 'LIBROS' ? 'libros' : tipo === 'PAGINAS' ? 'páginas' : 'horas'

    const hoy = new Date().toISOString().split('T')[0]

    return (
        <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-serif text-4xl leading-none text-texto">Crear reto</h1>
                <button onClick={() => navigate(-1)} className="text-texto-sec hover:text-texto" aria-label="Cerrar"><X size={22} /></button>
            </div>
            {error && <p className="text-error text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="etiqueta block mb-2">Título</label>
                    <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                           className="campo" placeholder="Ej: Maratón de septiembre" required />
                </div>
                <div>
                    <label className="etiqueta block mb-2">Descripción (opcional)</label>
                    <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2}
                              className="campo" placeholder="En qué consiste, por qué merece la pena…" />
                </div>
                <div>
                    <label className="etiqueta block mb-2">Tipo de reto</label>
                    <div className="grid grid-cols-3 gap-2">
                        {tipos.map((t) => (
                            <button key={t.value} type="button" onClick={() => setTipo(t.value)}
                                    className={`p-3 rounded text-left text-sm transition-colors ${tipo === t.value ? 'border border-texto text-texto bg-superficie' : 'border border-linea text-texto-sec hover:text-texto'}`}>
                                <p className="font-medium">{t.label}</p><p className="text-xs mt-1 opacity-70">{t.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="etiqueta block mb-2">Modalidad</label>
                    <div className="grid grid-cols-2 gap-2">
                        {modalidades.map((m) => (
                            <button key={m.value} type="button" onClick={() => setModalidad(m.value)}
                                    className={`flex-1 p-3 rounded text-left text-sm transition-colors ${modalidad === m.value ? 'border border-texto text-texto bg-superficie' : 'border border-linea text-texto-sec hover:text-texto'}`}>
                                <p className="font-medium">{m.label}</p><p className="text-xs mt-1 opacity-70">{m.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="etiqueta block mb-2">Meta ({metaLabel})</label>
                    <input type="number" value={meta} onChange={(e) => setMeta(e.target.value)} min="1"
                           className="campo w-32" placeholder="Ej: 5" required />
                </div>
                <div>
                    <label className="etiqueta block mb-2">Fecha límite</label>
                    <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} min={hoy}
                           className="campo" required />
                </div>
                <button type="submit" className="w-full btn-acento">Crear reto</button>
            </form>
        </div>
    )
}