import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

export default function Registro() {
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [exito, setExito] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await api.post('/auth/registro', { nombre, email, password })
            setExito(true)
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al registrarse')
        }
    }

    return (
        <div className="flex justify-center mt-20">
            <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-lg border border-amber-500/20 w-full max-w-md">
                <h2 className="text-2xl font-bold text-amber-400 mb-6 text-center">Crear cuenta</h2>

                {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                {exito && <p className="text-green-400 text-sm mb-4 text-center">Cuenta creada. Redirigiendo al login...</p>}

                <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-1">Nombre</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-1">Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
                        required
                    />
                </div>

                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 rounded">
                    Registrarse
                </button>

                <p className="text-gray-400 text-sm mt-4 text-center">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-amber-400 hover:underline">Inicia sesión</Link>
                </p>
            </form>
        </div>
    )
}