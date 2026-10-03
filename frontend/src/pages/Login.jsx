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
        <div className="flex justify-center pt-12 sm:pt-20">
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
                <h1 className="font-serif text-4xl sm:text-5xl leading-none tracking-tight text-texto text-center">Iniciar sesión</h1>
                <p className="text-texto-sec text-sm text-center mt-3 mb-10">Vuelve a tu cuaderno de lectura.</p>
                {error && <p className="text-error text-sm mb-5 text-center">{error}</p>}
                <div className="mb-5">
                    <label className="etiqueta block mb-2">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                           className="campo" required />
                </div>
                <div className="mb-8">
                    <label className="etiqueta block mb-2">Contraseña</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                           className="campo" required />
                </div>
                <button type="submit" className="btn-acento w-full py-2.5">Entrar</button>
                <p className="text-texto-sec text-sm mt-6 text-center">
                    ¿No tienes cuenta? <Link to="/registro" className="text-texto underline underline-offset-4 decoration-texto-ter hover:decoration-texto">Regístrate</Link>
                </p>
            </form>
        </div>
    )
}