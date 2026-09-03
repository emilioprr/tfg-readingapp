import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function CrearReto() {
    const { usuario } = useAuth()
    const navigate = useNavigate()

    const [titulo, setTitulo] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [tipo, setTipo] = useState('LIBROS')
    const [modalidad, setModalidad] = useState('PERSONAL')
    const [meta, setMeta] = useState('')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!titulo.trim() || !meta || !fechaInicio || !fechaFin) {
            setError('Completa todos los campos obligatorios')
            return
        }

        try {
            await api.post('/retos', {
                titulo,
                descripcion,
                tipo,
                modalidad,
                meta: parseInt(meta),
                fechaInicio,
                fechaFin,
                idCreador: usuario.id,
            })
            navigate('/retos')
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al crear el reto')
        }
    }

    const tipos = [
        { value: 'LIBROS', label: '📚 Libros', desc: 'Terminar X libros' },
        { value: 'PAGINAS', label: '📄 Páginas', desc: 'Leer X páginas' },
        { value: 'HORAS', label: '⏱ Horas', desc: 'Leer X horas' },
        { value: 'LIBROS_AUTOR', label: '✍️ Por autor', desc: 'Leer X libros de un autor' },
    ]

    const modalidades = [
        { value: 'PERSONAL', label: 'Personal', desc: 'Solo para ti' },
        { value: 'COMPARTIDO', label: 'Compartido', desc: 'Otros pueden adoptarlo' },
    ]

    const metaLabel = tipo === 'LIBROS' || tipo === 'LIBROS_AUTOR' ? 'libros' :
        tipo === 'PAGINAS' ? 'páginas' : 'horas'

    return (
        <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-amber-400">Crear reto</h1>
                <button onClick={() => navigate(-1)}
                        className="text-gray-400 hover:text-gray-200 text-2xl">
                    ✕
                </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-gray-400 text-sm mb-1">Título</label>
                    <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        placeholder="Ej: Maratón de lectura de septiembre"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">Descripción (opcional)</label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        rows={2}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        placeholder="Describe tu reto..."
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-2">Tipo de reto</label>
                    <div className="grid grid-cols-2 gap-2">
                        {tipos.map((t) => (
                            <button key={t.value} type="button" onClick={() => setTipo(t.value)}
                                    className={`p-3 rounded-lg text-left text-sm ${
                                        tipo === t.value
                                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                                            : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200'
                                    }`}>
                                <p className="font-medium">{t.label}</p>
                                <p className="text-xs mt-1 opacity-70">{t.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-2">Modalidad</label>
                    <div className="flex gap-2">
                        {modalidades.map((m) => (
                            <button key={m.value} type="button" onClick={() => setModalidad(m.value)}
                                    className={`flex-1 p-3 rounded-lg text-left text-sm ${
                                        modalidad === m.value
                                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                                            : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200'
                                    }`}>
                                <p className="font-medium">{m.label}</p>
                                <p className="text-xs mt-1 opacity-70">{m.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">Meta ({metaLabel})</label>
                    <input
                        type="number"
                        value={meta}
                        onChange={(e) => setMeta(e.target.value)}
                        min="1"
                        className="w-32 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        placeholder="Ej: 5"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Fecha inicio</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Fecha fin</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                            required
                        />
                    </div>
                </div>

                <button type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 rounded">
                    Crear reto
                </button>
            </form>
        </div>
    )
}