import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const res = await api.post('/auth/login', { email, password })
            login(res.data)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al iniciar sesión')
        }
    }

    return (
        <div className="flex justify-center mt-20">
            <form onSubmit={handleSubmit} className="bg-dark-card p-8 rounded-2xl border border-dark-border w-full max-w-md">
                <h2 className="text-2xl font-bold text-dark-text mb-6 text-center">Iniciar sesión</h2>
                {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                <div className="mb-4">
                    <label className="block text-dark-muted text-sm mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                           className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" required />
                </div>
                <div className="mb-6">
                    <label className="block text-dark-muted text-sm mb-1">Contraseña</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                           className="w-full bg-dark-elevated border border-dark-border rounded-lg px-4 py-2.5 text-dark-text focus:border-terra focus:outline-none transition-colors" required />
                </div>
                <button type="submit" className="w-full bg-terra hover:bg-terra-hover text-white font-semibold py-2.5 rounded-lg transition-colors">Entrar</button>
                <p className="text-dark-muted text-sm mt-4 text-center">
                    ¿No tienes cuenta? <Link to="/registro" className="text-terra hover:text-terra-hover transition-colors">Regístrate</Link>
                </p>
            </form>
        </div>
    )
}